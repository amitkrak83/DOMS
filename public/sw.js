const CACHE = 'doms-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/_next/data')
  ) return

  // Next.js static assets — cache first (they have content hashes, safe to cache forever)
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then(hit => hit ?? fetch(request).then(res => {
        const cloned = res.clone()
        caches.open(CACHE).then(c => c.put(request, cloned))
        return res
      }))
    )
    return
  }

  // Pages — network first, fall back to cache so app opens offline
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const cloned = res.clone()
          caches.open(CACHE).then(c => c.put(request, cloned))
        }
        return res
      })
      .catch(() => caches.match(request))
  )
})
