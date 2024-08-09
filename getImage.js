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
    const uint8Array = new Uint8Array(await response.arrayBuffer());
    // Get the last 129 bytes as SHA-512 hash raw
    const hashHexRaw = new TextDecoder('utf-8').decode(uint8Array.slice(-129)).replace('\n', '');
    // Remove the last 129 bytes
    const newUint8Array = uint8Array.slice(0, -129);
    // Calculate SHA-512 hash
    const subtle = crypto.subtle;
    if (subtle) {
        const hashBuffer = await subtle.digest('SHA-512', newUint8Array);
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        // if hashHex is not equals
        if (hashHex !== hashHexRaw) {
            console.warn("URL:", url, "\nhashHexRaw:", hashHexRaw, "\nhashHex:   ", hashHex);
        }
    }
    // Convert the new Uint8Array back to a Blob
    const blob = new Blob([newUint8Array], { type: 'image/jpeg' });
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
    if ((await (await cftrace).text()).includes("loc=CN") && paths.length > 1) {
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

const cftrace = fetch("/cdn-cgi/trace");
