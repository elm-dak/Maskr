// Maskr extension — content script (runs only on the Maskr web app).
// Picks up an image the background worker stashed when the user clicked
// "Redact with Maskr", and hands it to the page via the maskr:load-image
// CustomEvent (the app listens for it). Then clears the pending image so a
// later plain visit to Maskr doesn't reload a stale picture.

const PENDING_KEY = "maskr_pending_image";

// The app's maskr:load-image listener is attached during the page's initial
// synchronous script, which runs well before this content script (document_idle),
// so a single dispatch is enough.
chrome.storage.local.get(PENDING_KEY, (out) => {
  const dataUrl = out && out[PENDING_KEY];
  if (!dataUrl) return;
  chrome.storage.local.remove(PENDING_KEY);
  window.dispatchEvent(new CustomEvent("maskr:load-image", { detail: dataUrl }));
});
