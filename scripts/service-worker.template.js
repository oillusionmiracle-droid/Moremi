/* Generated with a content digest for every required app file. No user data is cached here. */
const manifest = __PRECACHE_MANIFEST__;
const CACHE = `moremi-pack-${manifest.version}`;
const PREFIX = "moremi-pack-";
const expected = new Map(manifest.files.map(file => [file.url, file]));
async function rangeResponse(response,request) {
  const header=request.headers?.get("Range");
  if(!header)return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  const buffer=await response.arrayBuffer(),size=buffer.byteLength;
  const unsatisfied=()=>new Response(null,{status:416,headers:{"Content-Range":`bytes */${size}`}});
  if(!match||(!match[1]&&!match[2]))return unsatisfied();
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return unsatisfied();
  const headers=new Headers(response.headers);
  headers.set("Content-Range",`bytes ${start}-${end}/${size}`);headers.set("Content-Length",String(end-start+1));headers.set("Accept-Ranges","bytes");
  return new Response(buffer.slice(start,end+1),{status:206,headers});
}
async function digest(response) {
  const value = await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer());
  return Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, "0")).join("");
}
async function verified(cache, file) {
  const response = await cache.match(file.url);
  return Boolean(response?.ok && await digest(response) === file.sha256);
}
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Four at a time limits pressure on small phones and slower connections.
      for (let i = 0; i < manifest.files.length; i += 4) {
        await Promise.all(manifest.files.slice(i, i + 4).map(async file => {
          const response = await fetch(file.url, { cache: "no-store", credentials: "same-origin" });
          if (!response.ok || await digest(response) !== file.sha256) throw new Error(`Incomplete offline file: ${file.url}`);
          await cache.put(file.url, response);
        }));
      }
      await self.skipWaiting();
    } catch (error) {
      // Keep any previously complete version until the replacement is proven.
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    // Retain older packs for tabs that are still using the preceding hashed chunks.
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type !== "VERIFY") return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const checks = await Promise.all(manifest.files.map(file => verified(cache, file)));
    event.ports[0]?.postMessage({ ready: checks.every(Boolean), version: manifest.version, totalBytes: manifest.totalBytes });
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const key = request.mode === "navigate" ? "/" : url.pathname;
  if (!expected.has(key) && !key.startsWith("/_next/static/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // One complete shell and its matching chunks avoid mixing deployed versions.
    const cached = await cache.match(key);
    if (cached) return rangeResponse(cached,request);
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX)) {
        const previous = await (await caches.open(name)).match(key);
        if (previous) return rangeResponse(previous,request);
      }
    }
    return fetch(request);
  })());
});
