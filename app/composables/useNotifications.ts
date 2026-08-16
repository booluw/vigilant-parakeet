import type { APIMatch } from '~/types/api'

const FALLBACK_REFRESH = 60_000
const SEEN_KEY = 'sv-notify-seen'

type NotifStatus = 'unsupported' | 'idle' | 'denied' | 'subscribed' | 'fallback' | 'busy'

export function useNotifications() {
  const { favoriteTeams, favoriteMatches } = useFavorites()

  const status = useState<NotifStatus>('notif-status', () => 'idle')
  const busy = ref(false)
  const subscription = ref<PushSubscription | null>(null)
  const toast = useToast()

  const publicKey = useRuntimeConfig().public.pushPublicKey as string | undefined

  const swSupported = computed(() => import.meta.client && 'serviceWorker' in navigator)
  const notifSupported = computed(() => import.meta.client && 'Notification' in window)
  const pushSupported = computed(() => swSupported.value && 'PushManager' in window)

  const active = computed(() => status.value === 'subscribed' || status.value === 'fallback')

  const hasFavorites = computed(() =>
    Object.keys(favoriteTeams.value).length > 0 || favoriteMatches.value.length > 0
  )

  function favoritesPayload() {
    return {
      teams: Object.values(favoriteTeams.value).map(t => t.name),
      matches: [...favoriteMatches.value]
    }
  }

  async function registerSW(): Promise<ServiceWorkerRegistration | null> {
    if (!swSupported.value) return null
    return await navigator.serviceWorker.register('/sw.js')
  }

  let fallbackTimer: ReturnType<typeof setInterval> | null = null

  function stopFallbackPolling() {
    if (fallbackTimer) {
      clearInterval(fallbackTimer)
      fallbackTimer = null
    }
  }

  async function checkLive() {
    if (!hasFavorites.value) return
    try {
      const live = await $fetch<APIMatch[]>('/api/matches/live')
      const seen = readStoredJSON<string[]>(SEEN_KEY, [])
      const favNames = Object.values(favoriteTeams.value).map(t => t.name.toLowerCase())
      const interested = live.filter((m) => {
        const names = [m.teams?.home?.name, m.teams?.away?.name].map(n => n?.toLowerCase())
        return names.some(n => n && favNames.includes(n)) || favoriteMatches.value.includes(m.id)
      })
      const newly = interested.filter(m => !seen.includes(m.id))
      if (newly.length) {
        const reg = await navigator.serviceWorker.ready
        for (const m of newly) {
          reg.active?.postMessage({
            type: 'notify',
            payload: {
              title: `${m.title} is LIVE`,
              body: m.category || 'Live now',
              tag: `live-${m.id}`,
              data: { url: `/match/${m.id}` }
            }
          })
        }
      }
      writeStoredJSON(SEEN_KEY, live.map(m => m.id))
    } catch {
      // transient failure; next tick retries
    }
  }

  function startFallbackPolling() {
    stopFallbackPolling()
    checkLive()
    fallbackTimer = setInterval(checkLive, FALLBACK_REFRESH)
  }

  async function restore() {
    if (import.meta.server) return
    if (!swSupported.value || !notifSupported.value) {
      status.value = 'unsupported'
      return
    }
    if (Notification.permission === 'denied') {
      status.value = 'denied'
      return
    }
    try {
      const reg = await registerSW()
      if (reg && pushSupported.value) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          subscription.value = sub
          status.value = 'subscribed'
          syncFavorites()
          return
        }
      }
    } catch {
      // no active subscription; leave status as-is
    }
  }

  async function enable() {
    if (busy.value) return
    if (import.meta.server) return
    if (!swSupported.value || !notifSupported.value) {
      status.value = 'unsupported'
      return
    }

    busy.value = true
    status.value = 'busy'
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        status.value = perm === 'denied' ? 'denied' : 'idle'
        return
      }

      const reg = await registerSW()
      if (!reg) {
        status.value = 'unsupported'
        return
      }

      if (pushSupported.value && publicKey) {
        try {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          })
          subscription.value = sub
          const res = await $fetch<{ ok: boolean }>('/push/subscribe', {
            method: 'POST',
            body: {
              clientId: getClientId(),
              subscription: toPushSubscriptionJSON(sub),
              favorites: favoritesPayload()
            }
          })
          status.value = res.ok ? 'subscribed' : 'fallback'
          if (status.value === 'fallback') startFallbackPolling()
          return
        } catch {
          status.value = 'fallback'
          startFallbackPolling()
          return
        }
      }

      status.value = 'fallback'
      startFallbackPolling()
    } catch {
      status.value = 'idle'
      toast.add({
        title: 'Could not enable notifications',
        description: 'Something went wrong while subscribing.',
        color: 'error'
      })
    } finally {
      busy.value = false
    }
  }

  async function disable() {
    if (busy.value) return
    busy.value = true
    try {
      stopFallbackPolling()
      if (subscription.value) {
        try {
          await subscription.value.unsubscribe()
        } catch {
          // ignore unsubscribe errors
        }
        subscription.value = null
        try {
          await $fetch('/push/unsubscribe', {
            method: 'POST',
            body: { clientId: getClientId() }
          })
        } catch {
          // best-effort cleanup
        }
      }
      status.value = 'idle'
    } finally {
      busy.value = false
    }
  }

  let syncTimer: ReturnType<typeof setTimeout> | null = null

  function syncFavorites() {
    if (status.value !== 'subscribed') return
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      $fetch('/push/favorites', {
        method: 'POST',
        body: { clientId: getClientId(), favorites: favoritesPayload() }
      }).catch(() => {})
    }, 500)
  }

  watch([favoriteTeams, favoriteMatches], () => {
    syncFavorites()
  }, { deep: true })

  async function toggle() {
    if (active.value) {
      await disable()
    } else {
      await enable()
    }
  }

  onMounted(restore)

  onScopeDispose(stopFallbackPolling)

  return {
    status,
    busy,
    active,
    notifSupported,
    pushSupported,
    toggle,
    enable,
    disable
  }
}
