# Maskr — Changelog

All notable changes to Maskr are recorded here. Newest version on top.

Versioning: MAJOR.MINOR.PATCH — patch = bug fix, minor = new feature, major = milestone.

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
