//@ts-check
'use strict';

const bfsdomains = [
    "i0.hdslb.com", "i1.hdslb.com", "i2.hdslb.com", "archive.biliimg.com"
]

/**
 * @param {string} bfsurl
 */
async function getImageWithSHA512(bfsurl) {
    const url = bfsurl.replace("bfs://", `https://${bfsdomains[Math.floor(Math.random() * bfsdomains.length)]}/bfs/`);
    // Fetch the image
    const response = await fetch(url, {
        referrer: ''
    });
    // Convert ArrayBuffer to Uint8Array
    const ab = await response.arrayBuffer();
    // Get the last 129 bytes as SHA-512 hash raw
    const hashHexRaw = new TextDecoder('utf-8').decode(ab.slice(-129)).replace('\n', '');
    // Remove the last 129 bytes
    const content = ab.slice(0, -129);
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
    const img = document.createElement('img');
    img.alt = url;
    img.src = imageUrl;
    return img;
}

/**
 * @param {Array<string>} paths
 */
async function getImage(paths) {
    // directly use image from biliimg for CN
    if (await inchina && paths.length > 1) {
        for (const path of paths) {
            if (path.startsWith("bfs://")) {
                return getImageWithSHA512(path);
            }
        }
    }
    // randomly choose a source for global
    const path = paths[Math.floor(Math.random() * paths.length)];
    if (path.startsWith("bfs://")) {
        return getImageWithSHA512(path);
    } else {
        const img = document.createElement("img");
        img.src = "https://fitrom.xhustudio.eu.org" + path;
        return img;
    }
}

async function getIndexJson() {
  return await (await fetch("https://fitrom.xhustudio.eu.org/index.json")).json();
}

const inchina = fetch("/cdn-cgi/trace").then(r => r.text()).then(t => t.match("loc=CN"));
