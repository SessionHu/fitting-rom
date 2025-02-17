//@ts-check
'use strict';

const bfsdomains = [
  "i0.hdslb.com", "i1.hdslb.com", "i2.hdslb.com", "archive.biliimg.com"
]

/**
 * @param {string} bfsurl
 */
function bfs2https(bfsurl) {
  return bfsurl.replace("bfs://", `https://${bfsdomains[Math.floor(Math.random() * bfsdomains.length)]}/bfs/`);
}

/**
 * @param {string} bfsurl
 */
async function getImageWithSHA512(bfsurl) {
  const url = bfs2https(bfsurl);
  // Fetch the image
  const response = await fetch(url, { referrer: '' });
  // Convert ArrayBuffer to Uint8Array
  const ab = await response.arrayBuffer();
  // Get the last 129 bytes as SHA-512 hash raw
  const hashHexRaw = new TextDecoder('utf-8').decode(ab.slice(ab.byteLength - 129)).replace('\n', '');
  // Remove the last 129 bytes
  const content = ab.slice(0, ab.byteLength - 129);
  // Calculate SHA-512 hash
  const subtle = crypto.subtle;
  if (subtle) {
    (async () => {
      const hashBuffer = await subtle.digest('SHA-512', content);
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      // if hashHex is not equals
      if (hashHex !== hashHexRaw) {
        console.warn("URL:", url, "\nhashHexRaw:", hashHexRaw, "\nhashHex:   ", hashHex);
      }
    })();
  }
  // Convert the new Uint8Array back to a Blob
  const blob = new Blob([content], { type: 'image/jpeg' });
  // Create a URL for the Blob and display the image
  const imageUrl = URL.createObjectURL(blob);
  const img = createImageElement(imageUrl);
  img.alt = url;
  return img;
}

/**
 * @param {{raw?: string[], hashed?: string[]}} item
 */
async function getImage(item) {
  // directly use image from biliimg for CN
  if (await inchina) {
    if (item.raw) for (const path of item.raw) {
      if (path.startsWith("bfs://")) {
        return createImageElement(bfs2https(path));
      }
    }
    if (item.hashed) for (const path of item.hashed) {
      if (path.startsWith("bfs://")) {
        return getImageWithSHA512(path);
      }
    }
  }
  // randomly choose a source for global
  const typ = choice((() => {
    const arr = [];
    if (item.raw) arr.push('raw');
    if (item.hashed) arr.push('hashed');
    return arr;
  })());
  const pat = choice(item[typ]);
  if (pat.startsWith("bfs://")) {
    if (typ === 'hashed') return getImageWithSHA512(pat);
    else return createImageElement(bfs2https(pat));
  } else {
    return createImageElement("https://fitrom.xhustudio.eu.org" + pat);
  }
}

/**
 * @param {string} url
 */
function createImageElement(url) {
  const img = document.createElement("img");
  img.src = url;
  img.referrerPolicy = 'no-referrer';
  return img;
}

/**
 * @param {any[]} arr
 */
function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getIndexJson() {
  return await (await fetch("https://fitrom.xhustudio.eu.org/index.json")).json();
}

const inchina = fetch("/cdn-cgi/trace").then(r => r.text()).then(t => t.match("loc=CN"));
