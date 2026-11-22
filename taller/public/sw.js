/* Service worker: guarda la app en el celular para abrirla sin internet.
   Los datos (fichas, fotos) los guarda Firebase en su propia base local, no este archivo.
   Al publicar una versión nueva, sube el número de VERSION. */
const VERSION = 'checklis-v1';
const SHELL = [
  './', 'index.html', 'app.css', 'app.js', 'firebase-config.js', 'manifest.webmanifest',
  'vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js',
  'vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js', 'vendor/qrcode.js', 'vendor/jsQR.js', 'vendor/xlsx.full.min.js',
  'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2', 'fonts/barlow-latin-700-normal.woff2',
  'fonts/barlow-condensed-latin-600-normal.woff2', 'fonts/barlow-condensed-latin-700-normal.woff2',
  'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2',
  'img/logo-full.png', 'img/logo-inv.png', 'img/logo-gear.png', 'img/logo-gear-inv.png', 'img/icon-192.png', 'img/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Firebase y Google van directo a internet
  if (url.pathname.startsWith('/__/')) return; // rutas internas de Firebase Hosting (inicio de sesión)
  const isPage = req.mode === 'navigate';
  if (isPage || /\/(app\.js|app\.css|firebase-config\.js)$/.test(url.pathname)) {
    // Red primero: si hay internet se ve la última versión; sin internet, la guardada.
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(isPage ? 'index.html' : req, cp)); return r; })
      .catch(() => caches.match(isPage ? 'index.html' : req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
});
