// ─── Service Worker Self-Destruct / Clean Up ────────────────────────────────
// This script will automatically uninstall the service worker from the browser
// of any user who previously had it installed, restoring normal web behavior.

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
});

self.addEventListener('activate', (e) => {
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      // Reload all open pages so they load fresh from the network
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    });
});
