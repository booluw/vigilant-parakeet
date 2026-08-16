import type { Sport, APIMatch } from '~/types/api'

const REFRESH_INTERVAL: Record<'live' | 'today', number> = {
  live: 60_000,
  today: 180_000
}

export function useLiveMatches() {
  const mode = ref<'live' | 'today'>('live')
  const activeSport = ref<string>('all')
  const search = ref('')
  const lastUpdated = ref<Date | null>(null)

  const { data: matches, status, error, refresh } = useFetch<APIMatch[]>('/api/matches/live', {
    watch: false,
    onResponse: () => {
      lastUpdated.value = new Date()
    }
  })

  const { data: todayMatches, status: todayStatus, refresh: refreshToday } = useFetch<APIMatch[]>('/api/matches/all-today', {
    watch: false,
    immediate: false,
    onResponse: () => {
      lastUpdated.value = new Date()
    }
  })

  const todayLoading = computed(() => todayStatus.value === 'pending')

  const { data: sports } = useFetch<Sport[]>('/api/sports', { watch: false })

  const baseMatches = computed(() => (mode.value === 'live' ? (matches.value ?? []) : (todayMatches.value ?? [])))

  const availableSports = computed(() => {
    const list = sports.value ?? []
    if (!baseMatches.value.length) return list
    const categories = new Set(baseMatches.value.map(m => m.category))
    return list.filter(s => categories.has(s.id))
  })

  const selectedMatches = ref<APIMatch[] | null>(null)

  const loading = computed(() => status.value === 'pending')

  const filteredMatches = computed(() => {
    const all = baseMatches.value
    const base = activeSport.value === 'all'
      ? all
      : mode.value === 'live'
        ? (selectedMatches.value ?? [])
        : all.filter(m => m.category === activeSport.value)
    const q = search.value.trim().toLowerCase()
    if (!q) return base
    return base.filter(m => m.title.toLowerCase().includes(q))
  })

  const matchCount = computed(() => baseMatches.value.length)

  const sportLoading = ref(false)

  async function selectSport(sport: string) {
    activeSport.value = sport
    if (sport === 'all') {
      selectedMatches.value = null
      return
    }
    if (mode.value === 'today') return
    sportLoading.value = true
    try {
      selectedMatches.value = await $fetch<APIMatch[]>(`/api/matches/${sport}`)
    } finally {
      sportLoading.value = false
    }
  }

  async function selectMode(next: 'live' | 'today') {
    mode.value = next
    if (next === 'today') {
      await refreshToday()
    }
    if (activeSport.value !== 'all') {
      await selectSport(activeSport.value)
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null

  function startAutoRefresh() {
    stopAutoRefresh()
    timer = setInterval(() => {
      if (mode.value === 'live') {
        refresh()
        if (activeSport.value !== 'all') {
          selectSport(activeSport.value)
        }
      } else {
        refreshToday()
      }
    }, REFRESH_INTERVAL[mode.value])
  }

  function stopAutoRefresh() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(mode, () => {
    if (timer) startAutoRefresh()
  })

  onScopeDispose(stopAutoRefresh)

  return {
    matches,
    selectedMatches,
    todayMatches,
    filteredMatches,
    sports: availableSports,
    activeSport,
    search,
    loading,
    sportLoading,
    error,
    matchCount,
    lastUpdated,
    mode,
    todayLoading,
    selectMode,
    selectSport,
    startAutoRefresh,
    stopAutoRefresh,
    refresh
  }
}
