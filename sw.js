const CACHE = 'simon-cache@2.2.0';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
    .then(cache => {
      console.log('Opened cache');
      // Promise.all([
      //   //cors
      // ].map((url) => fetch(url, {
      //   mode: 'no-cors'
      // }).then((response) => {
      //   cache.put(url, response);
      // })));
      return cache.addAll([
        '/shared/js/cookie-v2.min.js',
        '/shared/js/synth.min.js',
        'index.html',
        'main@2.2.0.css',
        'manifest.json',
        'simon@2.2.0.js',
        'https://cdn.jsdelivr.net/npm/fastclick@latest/lib/fastclick.min.js',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://fonts.gstatic.com/s/materialicons/v38/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
        'https://unpkg.com/@material/button@0.36.1/dist/mdc.button.min.css',
        'https://unpkg.com/@material/dialog@0.36.1/dist/mdc.dialog.min.css',
        'https://unpkg.com/@material/fab@0.36.1/dist/mdc.fab.min.css',
        'https://unpkg.com/@material/icon-toggle@0.36.0/dist/mdc.icon-toggle.min.css',
        'https://unpkg.com/@material/layout-grid@0.34.0/dist/mdc.layout-grid.min.css',
        'https://unpkg.com/@material/list@0.36.0/dist/mdc.list.min.css',
        'https://unpkg.com/@material/ripple@0.36.0/dist/mdc.ripple.min.css',
        'https://unpkg.com/@material/textfield@0.36.1/dist/mdc.textfield.min.css',
        'https://unpkg.com/@material/top-app-bar@0.36.1/dist/mdc.top-app-bar.min.css',
        'https://unpkg.com/@material/auto-init@0.35.0/dist/mdc.autoInit.min.js',
        'https://unpkg.com/@material/dialog@0.36.1/dist/mdc.dialog.min.js',
        'https://unpkg.com/@material/icon-toggle@0.36.0/dist/mdc.iconToggle.min.js',
        'https://unpkg.com/@material/ripple@0.36.0/dist/mdc.ripple.min.js',
        'https://unpkg.com/@material/textfield@0.36.1/dist/mdc.textfield.min.js',
        'https://unpkg.com/firebase@5.1.0/firebase-app.js',
        'https://unpkg.com/firebase@5.1.0/firebase-database.js'
      ]);
    }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName != CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) {
        return response;
      }
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          console.log(response);
          const responseToCache = response.clone();
          caches.open(CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
    })
  );
});
