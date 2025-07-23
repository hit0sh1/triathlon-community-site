const CACHE_NAME = 'okinawa-triathlon-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// インストール時のキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエストの処理
self.addEventListener('fetch', (event) => {
  // HTTPSまたはHTTPリクエストのみ処理
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // キャッシュがあればそれを返す、なければネットワークから取得
          if (response) {
            return response;
          }
          return fetch(event.request).catch(() => {
            // ネットワークエラーの場合は何もしない
            return new Response('Network error', { status: 408 });
          });
        })
        .catch(() => {
          // キャッシュエラーの場合はネットワークから取得を試行
          return fetch(event.request).catch(() => {
            return new Response('Service unavailable', { status: 503 });
          });
        })
    );
  }
});

// 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});