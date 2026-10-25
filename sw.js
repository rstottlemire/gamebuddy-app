const CACHE = 'gamebuddy-v4';
const ASSETS = [
    './index.html',
    './manifest.json',
    './icons/icon.svg',
    'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            Promise.allSettled(ASSETS.map(url => cache.add(url)))
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

function networkFirst(request) {
    return fetch(request).then(res => {
        if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
    }).catch(() => caches.match(request).then(r => r || caches.match('./index.html')));
}

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    // Network-first for the app page (so updates show up right away) and Google Fonts;
    // cache-first for everything else
    const url = e.request.url;
    if (e.request.mode === 'navigate' || url.endsWith('/index.html') ||
        url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        e.respondWith(networkFirst(e.request));
    } else {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request))
        );
    }
});
