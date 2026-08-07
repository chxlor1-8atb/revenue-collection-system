const CACHE_NAME = 'revenue-collection-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through fetch handler
  // This is the minimum requirement for Chrome to prompt for installation
  event.respondWith(fetch(event.request).catch(() => {
    return new Response("Offline mode is not fully supported yet. Please check your internet connection.");
  }));
});
