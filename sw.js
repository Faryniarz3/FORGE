// FORGE Service Worker — cache-first strategy with update detection
const CACHE_NAME = 'forge-v1';
const CACHED_URLS = ['/FORGE/FORGE_workout_tracker.html'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHED_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Only handle GET requests for our app HTML
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isAppPage = url.pathname === '/FORGE/FORGE_workout_tracker.html' || url.pathname === '/FORGE/';

  if (isAppPage) {
    // Network-first for app shell — ensures updates are picked up
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() {
        // Offline — serve from cache
        return caches.match(event.request);
      })
    );
  }
  // All other requests (fonts, USDA API, GitHub API) pass through normally
});
