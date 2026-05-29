# Maskr — Changelog

All notable changes to Maskr are recorded here. Newest version on top.

Versioning: MAJOR.MINOR.PATCH — patch = bug fix, minor = new feature, major = milestone.

---

## v0.10 — 2026-05-29
### Added — Video Redactor (new tab)
- Drop MP4 / WebM / MOV → Maskr processes every frame, applies face and/or weapon redaction, outputs a downloadable redacted WebM file — 100% in-browser, nothing uploaded.
- Uses same MediaPipe FaceDetector + ObjectDetector already loaded for image detection — no extra model download if they're already warm.
- Configurable detection rate slider (detect every N frames, default 5 = balance of speed vs accuracy).
- Block / Blur / Pixel redaction style applies to all video detections.
- Live preview canvas updates as each frame is processed.
- Real-time progress bar with ETA countdown.
- MediaRecorder API with VP9/VP8/WebM automatic codec selection based on browser support.
- Output file size shown before download.

### Fixed — weapon detection sensitivity
- Lowered default EfficientDet `scoreThreshold` from 0.4 → 0.25 so partial occlusions and difficult angles are detected.
- Expanded `WEAPON_COCO` class set to include additional detectable objects (baseball bat, bottle, fork — objects that appear in social-media content flagged by platforms).
- `maxResults` raised from 30 → 50 for denser scenes.

### Fixed — adult content model load failure
- NSFWJS model was loading from jsDelivr npm path which doesn't serve the model.json + shard files correctly. Switched to the stable GCP Storage URL (`storage.googleapis.com/tmdata/nsfwjs/`) — the same URL the library uses by default.

---

## v0.9 — 2026-05-29
### Added — content safety detection
- **Find weapons** (lazy-loaded, MediaPipe EfficientDet Lite, ~3.4 MB one-time): detects knives and scissors from COCO 80-class model with bounding boxes. GPU delegate with automatic CPU fallback. 20% padding applied around detected boxes. Clear note shown to users when no weapons found: gun detection requires a specialized model (v0.10).
- **Find adult content** (lazy-loaded, NSFWJS + TensorFlow.js, ~6 MB one-time): classifies image via MobileNet NSFW model. Flags Porn/Hentai at configurable threshold, Sexy at threshold+0.2. When unsafe content detected, adds a full-image redaction box (can be refined with manual Draw mode boxes). All predictions logged to console.
- **Detection threshold slider** in panel: applies to weapon and adult detection. Default 50%. Re-scan after adjusting.
- Both new detection types integrate with existing Block/Blur/Pixel redaction styles and the undo/redo history system.

### Fixed — Part 1 (v0.8.1 merged here): face + OCR conflict
- **Race condition (root cause)**: `imgRunDetection()` (called when OCR finishes) was doing `state.detections = filter(manual-only)`, which wiped face/name/weapon/adult detections added by independent lazy pipelines. If the user clicked "Find Faces" while OCR was still running, faces were silently cleared the moment OCR completed. Fixed: filter now preserves all `LAZY_SUBTYPES` (face, name, weapon, adult).
- **GPU→CPU fallback**: Face detector now tries GPU delegate first; on failure (WebGL not available or GPU locked) automatically retries with CPU delegate. No silent failure.
- **Console logging added** throughout: OCR start, found count, state after write; face detector load/ready/start/found; render call with type list. Diagnosing future issues is now a 10-second console read.
- **Reset completeness**: `imgResetBtn` and `imgStartProcessing` both now reset `weaponsScanned`, `nudityScanned` in addition to existing flags.

### Known limitations (v0.10 planned)
- Gun/firearm detection: COCO does not include a gun class. A specialized weapon dataset model is required.
- Blood/gore detection: no browser-compatible model with bounding boxes exists at this time. Planned.
- Adult content: NSFWJS returns image-level classification only — no bounding box. Full-image redaction is added; user can trim with manual boxes.

---

## v0.8 — 2026-05-29
### Fixed — QR generator
- **Root cause**: `qrcode@1.5.3` was loaded via a `<script>` tag in `<head>` at page startup. The CDN path changed and the script failed silently, leaving `QRCode` undefined. The generator then showed the dead error message.
- **Fix**: Removed all eager library `<script>` tags except Tesseract. QR library is now lazy-loaded on first QR tab use (or pre-warmed 2 s after page load in background) with: jsDelivr primary → unpkg fallback, 5 s timeout per CDN, auto-retry on failure, localStorage cache so subsequent visits work offline. Version pinned to `qrcode@1.5.4`.
- Added visual QR engine status dot (green/yellow/red) in the tab bar and form header.
- "Generate" now shows an inline Retry button on CDN failure — no more dead dead-end error text.
- WiFi password field now has show/hide toggle.
- Contrast ratio check (WCAG 4.5:1) warns when chosen colors won't scan reliably.
- Added Organisation field to Contact/vCard form.

### Fixed — PDF detection (was returning 0 items on all PDFs)
- **Root cause**: The detection pipeline only called Tesseract OCR on rendered canvases. Text-based PDFs produce high-quality vector text that OCR handles poorly (OCR of rendered vector text is slow and inaccurate). The `detectFromOcrData` function was also not wired to receive the PDF's actual text content — it received OCR data from a poorly-rendered small canvas.
- **Fix**: Implemented **two-mode per-page detection**:
  - **Text-layer mode** — calls `page.getTextContent()`, groups items into lines by baseline Y, converts PDF coordinate space (Y-up) to canvas coordinate space (Y-down), builds a synthetic Tesseract-compatible data structure, and passes it through the same `detectFromOcrData` engine at `scale=1` (PDF-point coordinates). Detection coords are in 1× PDF-point space.
  - **OCR fallback mode** — used when text content is <20 meaningful characters (scanned/image pages). Renders at `OCR_SCALE=2` (double resolution) and runs Tesseract, same as image tool.
- Detection coordinates are always stored in 1× PDF-point space. During export, multiplied by `OCR_SCALE` to redact the 2× canvas correctly.
- Added full console pipeline log: page size, mode chosen, text preview, detection list per page, total count.

### Added — PDF multi-page preview
- All pages rendered as thumbnails (scaled to max 300px width) and displayed in a scrollable left panel, each with a detection-count badge.
- Page cleanup (`page.cleanup()`) after each page to prevent memory leaks on large PDFs.

### Added — Library loading architecture
- `loadLib(urls, globalName, cacheKey)` — unified loader: localStorage cache (30-day TTL, background refresh) → primary CDN (jsDelivr) → fallback CDN (unpkg), 5 s timeout per attempt.
- QR library cached in localStorage after first successful load (works offline after first visit).
- PDF.js and pdf-lib lazy-loaded on PDF tab activation (too large for localStorage cache).
- Status dots in tab labels: green = loaded, yellow = loading, red = failed.
- PDF engine pre-loaded in background when PDF tab is clicked.
- QR engine pre-warmed 2 s after page load (background, not blocking).

### Added — Test modes
- `?test-pdf=1` — simulates the PDF text-layer pipeline against a built-in sample and logs `✓`/`✗` per pattern to console.

---

## v0.7 — 2026-05-29
### Added
- **BIC / SWIFT detection** — 8- or 11-char pattern (bank + country + location + optional branch), validated against a full ISO country-code set. Almost zero false positives.
- **Sort code** — UK sort codes in `DD-DD-DD` or `DD DD DD` format.
- **Account number** — 7–10 digit runs detected only when the same line contains a label word (Account, Acct, A/C, Compte, حساب, Cuenta, etc.) in English, French, Arabic, and Spanish.
- **IBAN overhaul** — regex now matches space-formatted IBANs (`GB82 WEST 1234 5678 9012 34`). Added Mod-97 checksum validation (eliminates all false positives) and a 66-country IBAN country-code allowlist.
- **Phone false-positive fix** — phones without a `+`/`00` international prefix are only flagged when the same line contains a label word (Phone, Tel, Mobile, Téléphone, الهاتف, Teléfono, etc.). Removes most spurious matches.
- **Address / postcode detection** — matches UK (`SW1A 2AA`) and Canadian (`K1A 0B1`) postcodes standalone; US 5-digit ZIPs only when the line contains an address keyword. Off by default; toggle in the panel.
- **Names NER** — "Find names" button lazy-loads compromise.js (~500 KB, once) and runs in-browser people detection. Found names are mapped back to OCR word bboxes and added as redactable boxes.
- **Financial document heuristic** — if OCR text contains words like IBAN, Account, Statement, Invoice, Balance, the "Long numbers" toggle auto-enables.
- **Multi-language label dictionaries** — label matching for account, phone, email, IBAN, BIC, sort code, and address now covers English, French, Arabic, and Spanish.
- **Debug overlay** (`?debug=1`) — draws faint blue boxes around every OCR word with its recognized text, making detection gaps immediately diagnosable.
- **Test mode** (`?test=1`) — on page load, runs all detection patterns against a hardcoded sample containing one of each type and logs `✓`/`✗` per pattern to the console.

### Fixed
- **Tab switching broken** — `switchTool` was building element IDs as `"imageTab"` etc. but HTML uses `"tabImage"` etc. The TypeError fired after `activeTool` was already mutated, causing tabs to stay blank AND Ctrl+V paste to stop working (paste guard checked the stale `activeTool` value). Fixed with a lookup map.

---

## v0.6 — 2026-05-29
### Added
- **QR Code Generator** — new QR tab. Supports URL, plain text, WiFi credentials (SSID/password/security/hidden), and vCard contacts. Size (S/M/L), error correction (L/M/Q), custom dark/light colors. Download PNG, copy to clipboard.

## v0.5 — 2026-05-29
### Added
- **PDF Redactor** — new PDF tab. Drop any PDF (short or long), Maskr renders every page with PDF.js, OCRs each page with Tesseract.js, auto-detects the same patterns as the image tool (emails, phones, cards, IBANs, URLs, numbers), and exports a fully redacted PDF via pdf-lib. All in-browser.
- Language selector for PDF OCR (same options as image tool).
- First-page thumbnail preview during processing.
- Detection counts per category across all pages with global on/off toggles.
- Block / Blur / Pixelate redaction style applies to all pages.

### Architecture
- Shared detection engine (`detectFromOcrData`, `pushDetection`) used by both image and PDF tools.
- Shared canvas redaction helpers (`applyRedactionToCtx`, `blurRegionInCtx`, `pixelateRegionInCtx`).
- Tool tabs (Image / PDF / QR) replace single-page layout; paste still works in image tab only.

## v0.4 — 2026-05-28
### Added
- **Undo / Redo** — Ctrl+Z / Ctrl+Y (or Cmd+Z / Cmd+Shift+Z on Mac). Dedicated panel buttons too. History is capped at 50 checkpoints.
- **Right-click to delete a single box** — right-click any redacted area on the canvas to remove just that detection. Works in both Auto and Draw mode. Cursor changes to a pointer when hovering over a deletable box.
- **Multi-language OCR** — new language selector above the drop zone: English, French, Arabic, and combinations. Changing language while an image is open automatically re-scans.
- **JPG / WEBP export with quality slider** — export format selector (PNG · JPG · WEBP) in the Export panel. A quality slider (60–100%) appears for lossy formats.

### Fixed
- Removed unused `atToken` variable in `normalizeForOcr`.
- Merge bug in `addAutoDetection`: the box expansion after an overlap merge was computing incorrect dimensions (was re-reading `d.x`/`d.y` after mutation). Fixed to compute `nx2`/`ny2` before writing back.
- `btn:disabled` now also sets `pointer-events: none` so disabled buttons are fully inert.

---

## v0.3.1 — 2026-05-28
### Fixed
- **Blur style leaked content at edges.** The blur redaction style was applying its filter to an off-screen canvas that had no source pixels outside the box bounds, causing the blur to fade to transparent at every edge and potentially letting the original content show through. Fixed by drawing from a radius-padded source region so the blur computation always has real pixel context, then rendering only the target area.
- **Paste-new-image kept old manual boxes.** Pasting a new image while the work area was open left manual redaction boxes (and all auto detections) from the previous image in state. Those boxes then overlaid the new image at wrong coordinates. Fixed by fully resetting `state.detections` and `state.enabled` in `startProcessing()`, which is called for every new image regardless of how it arrives.
- **"Find faces" button stuck on "Toggle faces" when no faces were found.** After scanning an image with zero faces the button permanently read "Toggle faces", which was misleading (clicking it only re-showed the error). Button now reverts to "⊕ Find faces" unless the scan actually found faces.
- **Stale version comment in script.** The `/* Maskr v0.2 */` comment in the JavaScript block was not bumped when v0.3 shipped.

---

## v0.3 — 2026-05-28
### Added
- **Face detection.** New "Find faces" button uses Google MediaPipe (loaded on demand from CDN) to detect faces in the image and add them as redactable boxes. Runs fully in-browser; the model only downloads when the user clicks the button, so people who only redact text don't pay the cost.
- "Faces" row in the Detected panel with a live count and on/off toggle.
- Favicon (inline SVG matching the logo) and mobile theme-color.

### Notes
- Face model: BlazeFace short-range, loaded from Google's CDN. Small and fast.
- Detected face boxes are padded slightly to cover hair/head edges.

---

## v0.2 — 2026-05-28
### Fixed
- **Multiple detections.** Emails and phone numbers beyond the first are now all detected (previously only one was caught). Root causes: a global-regex position pointer leaking between lines, and overly aggressive deduplication.
- **OCR-mangled emails.** Added a normalization layer that fixes common OCR misreads before matching: spaces around `@`, `(at)`/`[at]` instead of `@`, and commas misread for dots in domains.
- Added a console debug log listing every line OCR read, to make future issues diagnosable.

### Added
- **Draw mode** — manually drag boxes to redact anything OCR misses (works on touch too).
- Image pre-processing (upscale + grayscale + contrast) before OCR for much better accuracy on screenshots.
- "by Taskflow team" credit in footer.

---

## v0.1 — 2026-05-27
### Added
- Initial release. Drop/paste/upload a screenshot, OCR via Tesseract.js, auto-detect emails, phones, credit cards (Luhn-validated), IBANs, URLs, long numbers.
- Three redaction styles: block, blur, pixelate.
- Download PNG and copy-to-clipboard export.
- 100% in-browser, no uploads, no servers.
