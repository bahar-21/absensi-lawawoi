const CACHE_NAME = 'absensi-lawawoi-v6.4.0';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', (event) => {

  // Hanya tangani request GET
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);

  // HTML → NETWORK FIRST
  if (
    event.request.mode === 'navigate' ||
    requestURL.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {

          // Simpan versi terbaru HTML ke cache
          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );

    return;
  }

  // Aset statis → CACHE FIRST
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((networkResponse) => {

            // Cache hanya response yang valid
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseClone = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }

            return networkResponse;
          });
      })
  );

});
