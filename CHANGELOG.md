# Maskr — Changelog

All notable changes to Maskr are recorded here. Newest version on top.

Versioning: MAJOR.MINOR.PATCH — patch = bug fix, minor = new feature, major = milestone.

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
