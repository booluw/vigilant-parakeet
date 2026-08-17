const SW_VERSION = '1.0.2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function notify(title, options) {
  self.registration.showNotification(title, options)
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-first for manifest and icons so updates propagate quickly
  if (
    url.pathname === '/manifest.webmanifest'
    || url.pathname.endsWith('.png')
    || url.pathname.endsWith('.ico')
    || url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'S3mTV'
  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: data.tag,
    data: data.data || {}
  }
  event.waitUntil(notify(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil((async () => {
    const target = new URL(url, self.location.origin).href
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of all) {
      if (new URL(client.url).pathname === new URL(target).pathname) {
        await client.focus()
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'getVersion') {
    event.source.postMessage({ type: 'version', version: SW_VERSION })
    return
  }
  if (event.data?.type === 'notify') {
    const data = event.data.payload || {}
    notify(data.title || 'S3mTV', {
      body: data.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: data.tag,
      data: data.data || {}
    })
  }
})
