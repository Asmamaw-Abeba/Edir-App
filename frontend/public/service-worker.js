const CACHE_NAME = 'app-cache-v2'; // Increment version for updates
const urlsToCache = [
  '/',
  '/index.html',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html', // Offline fallback page
];

// Maximum number of items to keep in the dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 50;

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('[Service Worker] Failed to cache resources:', error);
      });
    })
  );
  self.skipWaiting(); // Activate the service worker immediately
});

// Fetch event
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch event for', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return response; // Return cached response
      }
      console.log('[Service Worker] Fetching from network:', event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Dynamically cache the fetched response
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            limitCacheSize(CACHE_NAME, MAX_DYNAMIC_CACHE_ITEMS); // Enforce cache size limit
            return networkResponse;
          });
        })
        .catch(() => {
          // Serve offline.html for navigation requests when offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

// Utility function to limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    console.log('[Service Worker] Cache size limit reached, deleting:', keys[0].url);
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems); // Recursively enforce the limit
  }
}