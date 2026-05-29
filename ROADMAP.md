# Maskr — Roadmap

**Vision:** Grow users first, decide on money later. Keep the core free, fast, and private (everything in the browser, nothing uploaded). Become the obvious tool people reach for when they need to share a screenshot or photo without leaking sensitive info.

**Current version:** v0.3 (live at the Cloudflare Worker URL)

---

## Shipped
- v0.1 — Core OCR text redaction (emails, phones, cards, IBANs, URLs, numbers)
- v0.2 — Multi-detection fix, OCR-tolerant matching, manual Draw mode, image pre-processing
- v0.3 — Face detection (blur people)
- v0.4 — Undo/redo, right-click to delete a box, multi-language OCR, JPG/WEBP export
- v0.5 — PDF redactor (all pages, OCR + pattern detection, export redacted PDF)
- v0.6 — QR code generator (URL, text, WiFi, contact/vCard; custom colors + size)

## Next up (near term)
These are small, high-value, and keep the tool sharp:
1. **Delete a single box** (right-click on a manual or auto box to remove just that one). Users will want this fast.
2. **Undo / redo** (Ctrl+Z / Ctrl+Y).
3. **More OCR languages** — French and Arabic especially, given your audience. `Tesseract.createWorker("eng+fra+ara")`.
4. **Export options** — JPG/WEBP with a quality slider, for smaller files.

## Growth features (medium term)
Things that bring in or retain users:
5. **Strip metadata (EXIF)** from photos on export — location, device, timestamp. Big privacy win, easy to explain.
6. **Drag/resize existing boxes** for fine-tuning before export.
7. **"Redact all of one kind" quick actions** and a one-click "redact everything detected".
8. **Shareable result** — copy a redacted image straight to clipboard for pasting into chat (already partly there).

## Bigger bets (later)
9. **Batch mode** — drop several images, redact all, download a zip.
10. **PDF support** — redact text/faces in PDF pages, not just images.
11. **Browser extension** — right-click any image on a webpage → "Redact with Maskr".
12. **Embeddable widget** — let other sites embed Maskr; drives discovery.

## When to think about money (not yet)
Once there's real, repeat usage, options that don't betray the privacy promise:
- A "Pro" tier: batch mode, PDF, higher-res exports, no first-load model wait.
- Paid embeddable widget for businesses.
- Keep the core single-image tool free forever — that's the growth engine.

## Principles (don't break these)
- Everything runs in the browser. No uploads, ever.
- First load stays fast. Heavy models (faces) load only when asked.
- One job, done in seconds. Don't bloat the main flow.
