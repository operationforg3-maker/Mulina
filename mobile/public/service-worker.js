// Mu'Alina PWA Service Worker - Resilient Cache & Auto-Update
const CACHE_VERSION = 'mualina-v5-firebase';
const BASE_PATH = (self.registration && self.registration.scope)
  ? new URL(self.registration.scope).pathname
  : '/';

const CORE_ASSETS = [
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}favicon.png`,
];

// Install: Cache core assets and immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Installing cache:', CACHE_VERSION);
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Core asset caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Delete ALL old caches immediately to wipe out stale index.html
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_VERSION) {
            console.log('[SW] Purging stale cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients for version:', CACHE_VERSION);
      return self.clients.claim();
    })
  );
});

// Fetch Strategy:
// 1. HTML / Navigation: ALWAYS Network-First, with cache fallback for offline mode.
//    This guarantees users ALWAYS get the latest JS bundle hash and NEVER get trapped in stale cache!
// 2. Static Assets (JS, CSS, PNG): Cache-First with Network fallback.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigate = event.request.mode === 'navigate' || 
                     event.request.destination === 'document' ||
                     url.pathname.endsWith('/') || 
                     url.pathname.endsWith('index.html');

  if (isNavigate) {
    // Network-First for HTML
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(`${BASE_PATH}index.html`) || caches.match(BASE_PATH);
        })
    );
    return;
  }

  // Static Assets: Cache with Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid 200 responses from same origin
        // IMPORTANT: Never cache text/html responses when a .js was requested!
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin
        ) {
          const contentType = networkResponse.headers.get('content-type') || '';
          if (url.pathname.endsWith('.js') && contentType.includes('text/html')) {
            // Server returned HTML for a missing JS file (404 redirected to index.html)
            console.warn('[SW] Refusing to cache HTML as JS:', url.pathname);
            return networkResponse;
          }

          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Listen for message to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
