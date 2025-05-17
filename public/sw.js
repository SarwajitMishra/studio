
// A very basic service worker
const CACHE_NAME = 'shravya-playhouse-cache-v1';
const urlsToCache = [
  '/',
  // Add paths to essential static assets that are not versioned by Next.js in their names
  // For a robust PWA with Next.js, consider using a package like next-pwa
  // which handles caching of Next.js's build outputs (hashed JS/CSS files) automatically.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache');
        // Caching a minimal set of URLs. For a full offline experience,
        // more sophisticated caching strategies are needed, typically handled by next-pwa.
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('/_next/static/')));
      })
      .catch(err => {
        console.error('Service Worker: Cache addAll failed', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Basic cache-first strategy for non-Next.js static assets
  // More complex strategies are needed for full PWA functionality.
  if (urlsToCache.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response; // Serve from cache
          }
          return fetch(event.request); // Fetch from network
        })
    );
  } else {
    // For Next.js assets and other requests, just fetch from network.
    // A real PWA would implement more advanced caching here.
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
