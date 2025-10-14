const CACHE_NAME = 'kasirpro-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  // Tambahkan aset statis lainnya di sini jika ada, seperti CSS atau gambar utama
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/recharts/umd/Recharts.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Penting: gandakan request. Request adalah stream dan hanya bisa dikonsumsi sekali.
        // Kita perlu satu untuk cache dan satu untuk browser.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Periksa jika kita menerima respons yang valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Penting: gandakan respons.
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
