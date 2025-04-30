// Version of the cache
const CACHE_NAME = 'my-app-cache-v1';

// List of assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/bundle.js', // Adjust based on your build output
  '/static/css/main.css', // Adjust based on your build output
  '/manifest.json',
  '/favicon.ico', // Add your favicon
  '/logo192.png', // Add your app icons
  '/logo512.png',
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Installing and caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of clients immediately
  self.clients.claim();
});

// Fetch event: Serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache the new response for future use
        if (networkResponse && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline (e.g., return cached index.html for navigation)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});