// Minimal Service Worker to pass PWA criteria
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass through all requests for now. 
  // In Phase 3, we can cache the JS bundle here for true offline capability.
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
