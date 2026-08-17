import type { APIMatchTeam } from '~/types/api'

const MAX_SHORTCUTS = 4
const DEFAULT_ICON = '/pwa-192.png'

export function useShortcutsManifest() {
  const { favoriteTeams } = useFavorites()

  function buildManifest(favTeams: Record<string, APIMatchTeam>) {
    const teams = Object.values(favTeams).slice(0, MAX_SHORTCUTS)

    const shortcuts = teams.map(team => ({
      name: team.name,
      short_name: team.name.length > 12 ? team.name.slice(0, 12) + '…' : team.name,
      description: `Live matches for ${team.name}`,
      url: `/?favTeam=${encodeURIComponent(team.name)}`,
      icons: [{
        src: team.badge || DEFAULT_ICON,
        sizes: '96x96',
        type: team.badge ? 'image/png' : 'image/png'
      }]
    }))

    return {
      name: 'S3mTV',
      short_name: 'S3mTV',
      description: 'Personal live sports streaming app.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#1C1C1C',
      theme_color: '#1C1C1C',
      lang: 'en',
      icons: [
        { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ],
      shortcuts
    }
  }

  function updateManifestLink(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const existing = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (existing) {
      const oldHref = existing.href
      existing.href = url
      if (oldHref.startsWith('blob:')) {
        URL.revokeObjectURL(oldHref)
      }
    }
  }

  function refresh() {
    if (import.meta.server) return
    const manifest = buildManifest(favoriteTeams.value)
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
    updateManifestLink(blob)
  }

  watch(favoriteTeams, () => {
    refresh()
  }, { deep: true })

  onMounted(refresh)

  return { refresh }
}
