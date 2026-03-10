/* ═══════════════════════════════════════════════════════════════
   Flowkyn Service Worker — Smart Caching + Offline Support
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'flowkyn-v1';
const STATIC_CACHE = 'flowkyn-static-v1';

// Never cache these paths
const NO_CACHE_PATHS = ['/version.json', '/api/auth', '/api/health'];

// Network-first paths (always try fresh)
const NETWORK_FIRST_PATHS = ['/api/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    }).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin
  if (url.origin !== location.origin) return;

  // Never cache auth/health/version endpoints
  if (NO_CACHE_PATHS.some((p) => url.pathname.startsWith(p) || url.pathname === p)) return;

  // Network-first for HTML and API routes
  if (NETWORK_FIRST_PATHS.some((p) => url.pathname.startsWith(p) || url.pathname.endsWith('.html'))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first for navigation
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
});

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAN_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

/* ─── Strategies ─── */

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)(\?.*)?$/.test(pathname) ||
    pathname.startsWith('/assets/');
}
