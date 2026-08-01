// ─── Nivas Service Worker ────────────────────────────────────────────────────
// Bump CACHE_VERSION every time you deploy so ALL clients immediately get
// the new icons, manifest and app shell.
const CACHE_VERSION = 'v5';
const CACHE_NAME    = `nivas-cache-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(err => console.warn('[SW] Pre-cache failed:', err)))
      .then(() => self.skipWaiting()) // take control immediately
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // delete ALL old caches
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim()) // immediately control all open tabs
  );
});

// ── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;

  // ── Navigation (HTML pages / SPA routes) ──────────────────────────────────
  // Always serve the cached index.html for navigation requests to support SPA routing.
  // This avoids querying the server for subroutes that don't physically exist as files.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then((cachedResponse) => {
        return cachedResponse || fetch(e.request);
      })
    );
    return;
  }

  // ── Icons, manifest, logos → Network-first so updates are instant ──────────
  const isMetaAsset = ['/icon-192.png', '/icon-512.png', '/manifest.json', '/logo.svg', '/favicon.svg']
    .some((p) => url.pathname === p);

  if (isMetaAsset) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── All other static assets → Cache-first, dynamic cache on miss ───────────
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

// ── MESSAGE: skip waiting on demand ─────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
