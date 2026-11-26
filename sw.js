// Price Tag – modo offline
// Ao publicar uma versão nova do app, troque o número abaixo para os celulares baixarem a atualização.
const VERSAO = 'price-tag-v14';
const ARQUIVOS_BASE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS_BASE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Página do app: tenta a internet primeiro (pega a versão nova); sem internet, usa a guardada
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' }) // sempre confere no servidor se há versão nova
        .then((resp) => {
          const copia = resp.clone();
          caches.open(VERSAO).then((cache) => cache.put('./index.html', copia));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais arquivos (estilos, fontes, leitor de nota): usa o guardado e atualiza em segundo plano
  event.respondWith(
    caches.match(req).then((guardado) => {
      const daRede = fetch(req)
        .then((resp) => {
          if (resp && (resp.ok || resp.type === 'opaque')) {
            const copia = resp.clone();
            caches.open(VERSAO).then((cache) => cache.put(req, copia));
          }
          return resp;
        })
        .catch(() => guardado);
      return guardado || daRede;
    })
  );
});
