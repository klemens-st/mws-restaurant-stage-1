self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('restaurant-reviews').then(cache => {
      // Cache everything except images. We will cache them later.
      return cache.addAll([
        '/',
        '/css/styles.css',
        '/dist/js/app.js',
        '/data/restaurants.json',
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

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response;
      return fetch(e.request);
    })
  );
});