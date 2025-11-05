// Nombre de la caché
const CACHE_NAME = 'energisense-v1';
// Archivos del AppShell para cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // Los archivos de JS y CSS (como /assets/index-XXXX.js) 
  // se agregarán dinámicamente.
];

// 1. Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Estrategia de "Cache First"
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, devuélvela
        if (response) {
          return response;
        }
        
        // Si no, ve a la red a buscarla
        return fetch(event.request).then(
          response => {
            // Si la respuesta no es válida, no la cacheamos
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonamos la respuesta y la guardamos en caché
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

// 3. Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});