// FutureTech 3C 科技採購網 — Service Worker
const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `futuretech-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `futuretech-runtime-${CACHE_VERSION}`;

// App Shell：核心頁面與離線後仍需顯示的資源
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// 安裝階段：預先快取 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// 啟用階段：清除舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只處理 GET 請求（避免 POST 到 Supabase 等 API 被快取邏輯攔截）
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 導覽請求（頁面切換 / 重新整理）：Network First，失敗時退回快取或離線頁
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() =>
          caches.match('./index.html').then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // 站內同源靜態資源：Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 跨網域資源（CDN 字型/圖示庫/Unsplash 圖片等）：Stale-While-Revalidate
  // 注意：Supabase API 請求 (fywjqwvxbuobkmwrofvu.supabase.co) 與 GA 追蹤不快取，直接放行網路請求
  if (url.hostname.includes('supabase.co') || url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) {
    return; // 不攔截，交由瀏覽器直接處理
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
