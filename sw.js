self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('restaurant-reviews').then(cache => {
      // Cache everything except images. We will cache them later.
      return cache.addAll([
        '/',
        '/css/styles.css',
        '/dist/js/app.js',
        '/data/restaurants.json',
        '/restaurant/?id=1',
        '/img/1.jpg',
        '/img/2.jpg',
        '/img/3.jpg',
        '/img/4.jpg',
        '/img/5.jpg',
        '/img/6.jpg',
        '/img/7.jpg',
        '/img/8.jpg',
        '/img/9.jpg',
        '/img/10.jpg',
      ]);
    })
  );
});

// Inspired by https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open('restaurant-reviews').then((cache) => {
      return cache.match(e.request, {ignoreSearch: true}).then((response) => {
        return response || fetch(e.request).then((response) => {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});