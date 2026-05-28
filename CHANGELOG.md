# Maskr — Changelog

All notable changes to Maskr are recorded here. Newest version on top.

Versioning: MAJOR.MINOR.PATCH — patch = bug fix, minor = new feature, major = milestone.

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
