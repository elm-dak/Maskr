# Video Redaction — Technical Design (v0.10 Plan)

**Status**: Planning only. Do not build until v0.9 is stable.  
**Goal**: Extend Maskr's face, weapon, and text detection to video files, fully in-browser.

---

## 1. Video file reading

Use `HTMLVideoElement` + `<input type="file" accept="video/*">` for ingestion. No upload — the file stays on device.

```
File → URL.createObjectURL(file) → <video> element → seekable timeline
```

Frame extraction via `OffscreenCanvas` (or a regular canvas): seek the video to a timestamp, then `ctx.drawImage(video, 0, 0)` to capture the frame. `requestVideoFrameCallback` (Chrome 83+, Safari 15.4+) gives the exact frame timestamp for precise seeking. For Firefox compatibility, fall back to `video.currentTime` seek + `seeked` event.

---

## 2. Per-frame detection budget

**Target: 10 fps processing minimum** on mid-range hardware (2022 phone, 4-core CPU).

Recommended strategy: **adaptive FPS with fixed-time budget**.

```
BUDGET_MS = 80   // aim for ≤80ms per frame → 12fps theoretical max
for each frame:
  t0 = performance.now()
  detections = await runAllDetectors(frame)
  elapsed = performance.now() - t0
  if elapsed > BUDGET_MS: skip_next_N_frames(Math.ceil(elapsed / BUDGET_MS) - 1)
```

Detection cost estimates per frame (640×360 canvas):
- Face (MediaPipe BlazeFace): ~15ms GPU / ~40ms CPU
- Object/weapon (EfficientDet Lite): ~20ms GPU / ~60ms CPU
- OCR (Tesseract): ~800ms — **not viable per-frame**. Run once per scene change or on key-frames only (every 2s).

**Frame-level detection pipeline:**
- MediaPipe detectors run on every processed frame (GPU, fast)
- Tesseract runs on a sampled key-frame (every 60 frames at 30fps = every 2s)
- Results from key-frames are carried forward until the next key-frame

---

## 3. Object tracking between frames

Running independent detection on every frame produces flickering boxes (same knife detected at slightly different coordinates on each frame).

**Approach: IoU-based greedy tracker (no ML, pure geometry)**

```
track = []   // list of {id, bbox, lastSeen, subtype}

for each frame:
  newDets = detect(frame)
  for det in newDets:
    best = track.filter(t => iou(t.bbox, det.bbox) > 0.4).sort(by iou desc)[0]
    if best:
      best.bbox = smooth(best.bbox, det.bbox, alpha=0.6)  // exponential smoothing
      best.lastSeen = frameNum
    else:
      track.push({ id: uuid(), bbox: det.bbox, ... })
  // Expire tracks not seen for >15 frames
  track = track.filter(t => frameNum - t.lastSeen < 15)
```

`iou(a, b)` = intersection-over-union of two bounding boxes.
`smooth(prev, next, α)` = `α*next + (1-α)*prev` per coordinate — removes jitter without lag.

This gives each detected object a stable ID across frames. The same knife tracked as `weapon-1` from frame 1 to frame 90 produces one smooth redaction rectangle, not 90 independent flickering ones.

---

## 4. Output: re-encoded video with redactions burned in

### Encoding approach

**Primary (modern browsers)**: `VideoEncoder` from the **WebCodecs API** (Chrome 94+, Edge 94+, Safari 16.4+).

```
VideoEncoder → encodes redacted canvas frames → EncodedVideoChunk[]
MP4 muxer (mp4-muxer npm, ~25KB) → .mp4 Blob → download
```

Workflow:
1. Seek source video frame by frame at target FPS
2. Draw frame to canvas, apply redaction boxes
3. `VideoEncoder.encode(new VideoFrame(canvas, { timestamp }))` 
4. Collect chunks → mux to MP4 → `URL.createObjectURL(blob)` → download

**Fallback (Firefox / older Safari)**: `MediaRecorder` + canvas stream.
```
canvas.captureStream(fps) → MediaRecorder({ mimeType: 'video/webm;codecs=vp9' })
```
This requires real-time processing (can't seek faster than playback), so it's slower.

### Resolution and quality
- Default: match source resolution, VP9 / H.264 at 2 Mbps
- Quality slider: map to `VideoEncoder` `bitrate` parameter

---

## 5. Performance strategy: worker pool

Running detection on the main thread blocks the UI. Architecture:

```
Main Thread:
  - Video seek + canvas frame capture
  - User interaction (timeline scrubber, play/pause)
  - Final rendering of tracked redaction boxes

Worker Pool (N workers, where N = navigator.hardwareConcurrency / 2):
  - Each worker holds a MediaPipe detector instance
  - Main thread posts frames as ImageBitmap (zero-copy transfer)
  - Workers return detection results as plain objects
  - Results are merged on main thread with the tracker
```

Frame dispatch: round-robin across N workers. Workers process frames independently and return results out of order; main thread re-orders by frame number before applying tracking.

For Tesseract (key-frames only): one dedicated worker, separate from the detector pool, to avoid blocking the fast path.

---

## 6. UX

### Timeline scrubber
A `<input type="range">` driven by `video.currentTime` and `video.duration`. Click to seek, preview frame in canvas. Shows redaction boxes already computed at that timestamp.

### Preview before encode
"Preview" mode: play the video at 0.5× speed with redactions rendered live. The user sees exactly what the output will look like before committing to a 60s encode.

### Time estimate
```
estimatedSeconds = (video.duration * framesPerSecond * avgDetectionMs) / 1000
```
Shown as: "Estimated processing time: ~2 min 30s" before starting.

### Progress bar
Two-phase: "Analysing (45%)" → "Encoding (72%)". Both drive the same `<progress>` bar.

---

## 7. Redaction permanence

Unlike static images where pixel data is simply overwritten, video redaction must be **burned in** (not overlay metadata) so the underlying pixels are unrecoverable from the exported file. Both WebCodecs and MediaRecorder approaches burn in because they re-encode the canvas pixels directly — the source video frame is never included unmodified.

Do NOT use MP4 chapter/chapter-marker overlays or SVG filters on the video element — these are cosmetic and the underlying data remains in the file.

---

## 8. Scope for v0.10

In scope:
- MP4 / WebM / MOV input
- Face detection + weapon detection per frame
- Text detection on key-frames
- Tracked, jitter-free redaction boxes
- Download as MP4 (WebCodecs) or WebM (MediaRecorder fallback)

Out of scope for v0.10 (future):
- Audio redaction (bleeping / silencing)
- Subtitle/caption redaction
- Multi-stream (webcam + screen share) capture
- Cloud-accelerated processing for very long videos (contradicts privacy brand — would require careful architecture with client-side key encryption before upload)

---

## 9. Library choices

| Need | Library | Size | License |
|------|---------|------|---------|
| MP4 muxing (WebCodecs) | `mp4-muxer` | ~25 KB | MIT |
| Video frame decode | Native `HTMLVideoElement` | 0 | — |
| Detection | MediaPipe tasks-vision (already loaded) | ~1.5 MB WASM | Apache 2 |
| OCR | Tesseract.js (already loaded) | — | Apache 2 |
| Worker messaging | Native `Worker` + `ImageBitmap` | 0 | — |

No new heavy dependencies beyond `mp4-muxer`.

---

*This document is the v0.10 deliverable. Implementation begins after v0.9 is verified stable.*
