
const CACHE_NAME = 'adham-agritech-v1';
const TILE_CACHE_NAME = 'satellite-tiles-v1';

const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/globals.css',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== TILE_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache Satellite Tiles (Cache First strategy)
    if (url.href.includes('sentinel-hub.com') || url.href.includes('mapbox.com')) {
        event.respondWith(
            caches.open(TILE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Cache Static Assets (Stale While Revalidate)
    if (event.request.mode === 'navigate' || STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Default: Network Only
    event.respondWith(fetch(event.request));
});
