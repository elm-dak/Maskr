// Maskr extension — background service worker.
// Adds a "Redact with Maskr" item to the right-click menu on images. When
// clicked, it fetches the image bytes locally, hands them to the Maskr web app
// via chrome.storage, and opens the app. Nothing is ever uploaded to a server —
// the image goes straight from this browser into the in-page redaction tool.

const MASKR_URL = "https://maskr.mestafa-wydad66.workers.dev/";
const PENDING_KEY = "maskr_pending_image";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "maskr-redact-image",
    title: "Redact with Maskr",
    contexts: ["image"],
  });
});

// ArrayBuffer -> base64 data URL, chunked so we don't blow the call stack on
// String.fromCharCode for large images.
function toDataUrl(buffer, mime) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return "data:" + (mime || "image/png") + ";base64," + btoa(binary);
}

async function fetchAsDataUrl(srcUrl) {
  // data: URLs can be handed through unchanged.
  if (srcUrl.startsWith("data:")) return srcUrl;
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const mime = (res.headers.get("content-type") || "").split(";")[0] || "image/png";
  const buf = await res.arrayBuffer();
  return toDataUrl(buf, mime);
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "maskr-redact-image" || !info.srcUrl) return;
  try {
    const dataUrl = await fetchAsDataUrl(info.srcUrl);
    await chrome.storage.local.set({ [PENDING_KEY]: dataUrl });
    // Open Maskr; the content script on the page picks up the pending image.
    chrome.tabs.create({ url: MASKR_URL });
  } catch (err) {
    // Cross-origin images that block fetch (CORS) land here. Fall back to
    // opening Maskr so the user can still drag/paste the image manually.
    console.warn("Maskr: couldn't fetch image —", err && err.message);
    chrome.tabs.create({ url: MASKR_URL });
  }
});
