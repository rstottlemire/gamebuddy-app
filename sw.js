const CACHE = 'gamebuddy-v3';
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

self.addEventListener('fetch', e => {
    // Network-first for Google Fonts, cache-first for everything else
    const url = e.request.url;
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        e.respondWith(
            fetch(e.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return res;
            }).catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request))
        );
    }
});
