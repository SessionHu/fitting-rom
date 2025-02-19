//@ts-check
'use strict';

/**
 * @param {MessageEvent} ev
 */
self.onmessage = async (ev) => {
  const url = ev.data.url;
  // Fetch the image
  const response = await fetch(url, { referrer: '' });
  // Get ArrayBuffer
  const ab = await response.arrayBuffer();
  // Get the last 129 bytes as SHA-512 hash raw
  const hashHexRaw = new TextDecoder('utf-8').decode(ab.slice(ab.byteLength - 129)).replace('\n', '');
  // Remove the last 129 bytes
  const content = ab.slice(0, ab.byteLength - 129);
  // Calculate SHA-512 hash
  const subtle = crypto.subtle;
  if (subtle) {
    const hashBuffer = await subtle.digest('SHA-512', content);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    // if hashHex is not equals
    if (hashHex !== hashHexRaw) {
      console.warn("URL:", url, "\nhashHexRaw:", hashHexRaw, "\nhashHex:   ", hashHex);
    }
  }
  self.postMessage(content, { transfer: [content]});
  self.close(); 
};
