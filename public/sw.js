// Empty service worker to override the old self-destructing one
// This prevents it from unregistering the firebase-messaging-sw.js
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
