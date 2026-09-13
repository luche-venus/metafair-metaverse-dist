const releaseId = "20260913161443";
const cacheName = "DefaultCompany-METAFAIR-0.1.0-20260913161443";
const contentToCache = [
  "Build/fair.loader.js",
  "Build/fair.framework.js.br",
  "Build/fair.data.br",
  "Build/fair.wasm.br",
  "TemplateData/style.css"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(contentToCache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== cacheName).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const url = new URL(event.request.url);
    const isDynamic = event.request.mode === 'navigate' ||
      /(?:^|\/)(?:config\.json|ServiceWorker\.js)$/.test(url.pathname) ||
      /(?:Addressables|AssetBundles)\//.test(url.pathname);

    if (isDynamic) {
      // Always ask the server for the current shell/config/catalog/bundle.
      // These requests must not be hidden by a previous release's cache.
      return fetch(event.request, { cache: 'no-store' });
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(cacheName);
      await cache.put(event.request, response.clone());
    }
    return response;
  })());
});
