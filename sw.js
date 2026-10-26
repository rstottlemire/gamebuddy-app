// GameBuddy service worker: makes the app work fully offline.
// Bump CACHE whenever any file below changes, so phones download the new version.
const CACHE = 'gamebuddy-v10';
const ASSETS = [
    './index.html',
    './manifest.json',
    './fonts/fredoka-one.woff2',
    './fonts/nunito.woff2',
    './img/bg-landing.jpg',
    './img/bg-board.jpg',
    './img/bg-ttrpg.jpg',
    './img/bg-general.jpg',
    './img/hero-game-night.jpg',
    './img/panel-board.jpg',
    './img/panel-ttrpg.jpg',
    './img/panel-general.jpg',
    './icons/icon-192.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png'
];

self.addEventListener('install', e => {
    // addAll is all-or-nothing, so a half-downloaded app never gets installed
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// The page itself: try the network first (so updates show up), but fall back to the
// cached copy quickly when offline or on a slow connection. There is exactly one cached
// copy of the page ('./index.html'), refreshed on every successful load.
function pageRequest(request) {
    const fromCache = () => caches.match('./index.html');
    const network = fetch(request).then(res => {
        if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', clone));
        }
        return res;
    });
    const timeout = new Promise(resolve => setTimeout(resolve, 3000));
    return Promise.race([network.catch(() => null), timeout.then(() => null)])
        .then(res => res || fromCache())
        .then(res => res || network);
}

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;
    if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
        e.respondWith(pageRequest(e.request));
    } else {
        // Everything else (fonts, images, icons) is cache-first
        e.respondWith(
            caches.match(e.request, { ignoreSearch: true }).then(cached => cached || fetch(e.request).then(res => {
                if (res && res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
                return res;
            }))
        );
    }
});
