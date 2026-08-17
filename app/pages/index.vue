<script setup lang="ts">
import type { APIMatch } from '~/types/api'

useSeoMeta({
  title: 'Live matches — S3mTV'
})

const {
  filteredMatches,
  sports,
  activeSport,
  search,
  loading,
  sportLoading,
  todayLoading,
  matchCount,
  lastUpdated,
  mode,
  selectSport,
  selectMode,
  startAutoRefresh,
  refresh
} = useLiveMatches()

const { favoriteTeams, toggleTeam } = useFavorites()

const sportTabs = computed(() => [
  { value: 'all', label: 'All' },
  ...sports.value.map(s => ({ value: s.id, label: s.name }))
])

const modeItems = [
  { label: 'Live', value: 'live', icon: 'i-lucide-radio-tower' },
  { label: 'Today', value: 'today', icon: 'i-lucide-calendar-clock' }
]

const onlyFavoriteTeams = ref(false)

const favTeamNames = computed(() => Object.values(favoriteTeams.value))

const favoriteMatches = computed(() => {
  const fav = favTeamNames.value
  if (!fav.length) return []
  return filteredMatches.value.filter((m) => {
    const names = [m.teams?.home?.name, m.teams?.away?.name].filter((n): n is string => !!n)
    return names.some(n => fav.some(t => t.name.toLowerCase() === n.toLowerCase()))
  })
})

const hasAdminSource = (m: APIMatch) => m.sources.some(s => s.source === 'admin')

const displayedMatches = computed(() => {
  const base = onlyFavoriteTeams.value ? favoriteMatches.value : filteredMatches.value
  return base.filter(hasAdminSource)
})

const pageTitle = computed(() => (mode.value === 'live' ? 'Live matches' : 'Today\'s matches'))

const refreshCopy = computed(() => {
  const every = mode.value === 'live' ? '60s' : '3 min'
  return `${matchCount.value} ${mode.value === 'live' ? 'live' : 'upcoming'} · refreshes every ${every}`
})

const isRefreshing = ref(false)

async function refreshNow() {
  isRefreshing.value = true
  await refresh()
  isRefreshing.value = false
}

watch(activeSport, (sport) => {
  selectSport(sport)
})

watch(mode, (m) => {
  selectMode(m)
})

onMounted(() => {
  startAutoRefresh()
})
</script>

<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          {{ pageTitle }}
        </h1>
        <p class="mt-1 flex items-center gap-2 text-sm text-(--ui-text-muted)">
          <span
            v-if="mode === 'live'"
            class="relative flex size-2"
          >
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-(--ui-error) opacity-75" />
            <span class="relative inline-flex size-2 rounded-full bg-(--ui-error)" />
          </span>
          {{ refreshCopy }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <USegmented
          v-model="mode"
          :items="modeItems"
          size="sm"
        />
        <UInput
          v-model="search"
          placeholder="Search teams…"
          class="w-56"
          icon="i-lucide-search"
        />
        <UButton
          :icon="isRefreshing ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
          :disabled="isRefreshing"
          :class="{ 'animate-spin': isRefreshing }"
          color="neutral"
          variant="subtle"
          aria-label="Refresh matches"
          @click="refreshNow"
        />
      </div>
    </div>

    <div
      v-if="favTeamNames.length > 0"
      class="mt-4 flex flex-wrap items-center gap-2"
    >
      <span class="text-sm text-(--ui-text-muted)">
        My teams
      </span>
      <button
        v-for="team in favTeamNames"
        :key="team.name"
        class="group flex items-center gap-1.5 rounded-full border border-(--ui-text-muted)/20 py-1 pr-1.5 pl-2.5 text-sm transition hover:border-(--ui-text-muted)/40"
        @click="toggleTeam(team)"
      >
        <span class="max-w-32 truncate">{{ team.name }}</span>
        <UIcon
          name="i-lucide-x"
          class="size-3.5 text-(--ui-text-muted) transition group-hover:text-(--ui-error)"
        />
      </button>
      <USwitch
        v-model="onlyFavoriteTeams"
        size="sm"
        label="Only my teams"
      />
    </div>

    <div class="mt-6">
      <UTabs
        v-model="activeSport"
        :items="sportTabs"
        class="w-full"
      />
    </div>

    <div class="mt-6">
      <div
        v-if="loading || (mode === 'live' && sportLoading && activeSport !== 'all') || (mode === 'today' && todayLoading)"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton
          v-for="i in 8"
          :key="i"
          class="h-56 w-full rounded-lg"
        />
      </div>

      <UEmpty
        v-else-if="displayedMatches.length === 0"
        icon="i-lucide-tv"
        :title="search ? 'No matches match your search' : (onlyFavoriteTeams ? 'No live matches from your teams' : (mode === 'live' ? 'No live matches right now' : 'No matches scheduled today'))"
        :description="onlyFavoriteTeams ? 'Try disabling the \'Only my teams\' filter.' : 'Only matches with an available stream are listed — check back in a bit.'"
      />

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <MatchCard
          v-for="match in displayedMatches"
          :key="match.id"
          :match="match"
          :status="mode === 'live' ? 'live' : 'scheduled'"
        />
      </div>
    </div>

    <p
      v-if="lastUpdated"
      class="mt-6 text-center text-xs text-(--ui-text-muted)"
    >
      Last updated {{ lastUpdated.toLocaleTimeString() }}
    </p>
  </div>
</template>
