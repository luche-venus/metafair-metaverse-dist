const releaseId = "20261008044250";
const cacheName = "DefaultCompany-METAFAIR-0.1.0-20261008044250";
const contentToCache = [
  "Build/fair.loader.js",
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
    const isUnityCorePayload = /\/Build\/[^/]+\.(?:data|wasm|framework\.js)(?:\.br|\.unityweb)?$/.test(url.pathname);

    if (isDynamic) {
      // Always ask the server for the current shell/config/catalog/bundle.
      // These requests must not be hidden by a previous release's cache.
      return fetch(event.request, { cache: 'no-store' });
    }
    if (isUnityCorePayload) {
      // Immutable HTTP caching already covers these release-versioned files.
      // Avoid a second Cache Storage copy during first load.
      return fetch(event.request);
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
