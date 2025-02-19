//@ts-check
'use strict';

const bfsdomains = [
  "i0.hdslb.com", "i1.hdslb.com", "i2.hdslb.com", "archive.biliimg.com"
];

const FITROM_HOST = 'fitrom.xhustudio.eu.org';

/**
 * @param {string} bfsurl
 */
function bfs2https(bfsurl) {
  return bfsurl.replace("bfs://", `https://${bfsdomains[Math.floor(Math.random() * bfsdomains.length)]}/bfs/`);
}

const withWorker = (() => {
  /** @type {Promise<URL>[]} */
  const datas = [];
  const max = navigator.hardwareConcurrency || 2;
  /**
   * @param {string} hashimgurl
   * @return {Promise<URL>}
   */
  return async (hashimgurl) => {
    if (datas.length >= max) await Promise.race(datas);
    const worker = new Worker('https://' + FITROM_HOST + '/worker.js');
    worker.postMessage({
      url: hashimgurl
    });
    const data = new Promise((resolve) => {
      datas.push(data);
      worker.onmessage = (ev) => {
        resolve(ev.data);
        datas.splice(datas.indexOf(data), 1);
      };
    });
    return data;
  };
})();

/**
 * @param {string} bfsurl
 */
async function getImageWithSHA512(bfsurl) {
  const url = bfs2https(bfsurl);
  const bloburl = await withWorker(url);
  const img = createImageElement(bloburl.toString());
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
    return createImageElement("https://" + FITROM_HOST + pat);
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
  return await (await fetch("https://" + FITROM_HOST + "/index.json")).json();
}

const inchina = fetch("/cdn-cgi/trace").then(r => r.text()).then(t => t.match("loc=CN"));
