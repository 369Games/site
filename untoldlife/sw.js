'use strict';
/* Service worker: lets UntoldLife install like an app and open without internet.
   - The page (HTML): network first, the saved copy only when offline, so players always get the newest version.
   - Scripts, styles, images: served from the saved copy right away and refreshed in the background.
     Updated scripts and styles have a new ?v= in their address, so they are always fetched fresh.
   - Music (.mp3) and anything from other sites (Firebase, Google Forms, Cloudflare): passed through, never saved.
   Emergency switch: set KILL = true and publish; every player's worker removes itself and its saved files. */
const KILL = false;
const CACHE = 'untoldlife-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => KILL || k !== CACHE).map(k => caches.delete(k)));
    if (KILL) { await self.registration.unregister(); return; }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (KILL) return;
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /\.mp3$/i.test(url.pathname) || req.headers.has('range')) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const fresh = fetch(req).then(res => { if (res.ok && res.type === 'basic') cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || Response.error();
  })());
});
