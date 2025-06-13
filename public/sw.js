// This is the service worker file.

self.addEventListener('install', (event) => {
  console.log('Service Worker: A new version is installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating a new version...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // For now, we are not caching any requests.
  // This will be added later if offline functionality is needed.
  // console.log('Service Worker: Fetching', event.request.url);
}); 