<script setup lang="ts">
import type { APIMatch } from '~/types/api'

const route = useRoute()
const matchId = computed(() => String(route.params.id))

const { getMatch } = useMatchStore()

const match = ref<APIMatch | null>(null)
const pending = ref(true)
const toast = useToast()

const { streams, loading: streamsLoading, selected: selectedStream, sortedStreams, load: loadStreams, select } = useMatchStreams(match)

const { toggleTeam, isTeamFavorite, toggleMatch, isMatchFavorite } = useFavorites()

onMounted(async () => {
  match.value = await getMatch(matchId.value)
  pending.value = false
  if (match.value) {
    await loadStreams()
  }
})

useSeoMeta({
  title: () => (match.value ? `${match.value.title} — S3mTV` : 'S3mTV')
})

async function refreshStreams() {
  await loadStreams()
  toast.add({ title: 'Streams refreshed', color: 'success' })
}

const home = computed(() => match.value?.teams?.home)
const away = computed(() => match.value?.teams?.away)
const homeBadge = computed(() => badgeImage(home.value?.badge))
const awayBadge = computed(() => badgeImage(away.value?.badge))
</script>

<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <UButton
      icon="i-lucide-arrow-left"
      label="Back to live matches"
      to="/"
      color="neutral"
      variant="ghost"
      size="sm"
      class="mb-4"
    />

    <template v-if="pending">
      <USkeleton class="h-8 w-1/2 rounded-lg" />
      <USkeleton class="mt-4 aspect-video w-full rounded-lg" />
    </template>

    <template v-else-if="match">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-1.5">
          <TeamBadge
            v-if="home"
            :team="home"
            :badge="homeBadge"
            :align="'end'"
          />
          <button
            v-if="home"
            class="grid size-6 place-items-center rounded-full text-(--ui-text-muted) transition hover:text-yellow-400"
            :class="{ 'text-yellow-400': isTeamFavorite(home.name) }"
            :aria-label="`${isTeamFavorite(home.name) ? 'Unfavorite' : 'Favorite'} ${home.name}`"
            @click="toggleTeam(home)"
          >
            <UIcon
              name="i-lucide-star"
              class="size-4"
            />
          </button>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center gap-2">
            <UBadge
              color="error"
              variant="subtle"
              class="gap-1"
            >
              <span class="relative flex size-2">
                <span class="absolute inline-flex size-full animate-ping rounded-full bg-(--ui-error) opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-(--ui-error)" />
              </span>
              LIVE
            </UBadge>
            <UBadge
              v-if="match.popular"
              color="warning"
              variant="subtle"
              icon="i-lucide-flame"
            >
              Popular
            </UBadge>
          </div>
          <h1 class="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {{ match.title }}
          </h1>
          <p class="mt-1 text-sm text-(--ui-text-muted)">
            {{ matchDate(match.date) }} · {{ match.category }}
          </p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            v-if="away"
            class="grid size-6 place-items-center rounded-full text-(--ui-text-muted) transition hover:text-yellow-400"
            :class="{ 'text-yellow-400': isTeamFavorite(away.name) }"
            :aria-label="`${isTeamFavorite(away.name) ? 'Unfavorite' : 'Favorite'} ${away.name}`"
            @click="toggleTeam(away)"
          >
            <UIcon
              name="i-lucide-star"
              class="size-4"
            />
          </button>
          <TeamBadge
            v-if="away"
            :team="away"
            :badge="awayBadge"
            :align="'start'"
          />
        </div>
        <UButton
          icon="i-lucide-star"
          :label="isMatchFavorite(match.id) ? 'Starred' : 'Star match'"
          :color="isMatchFavorite(match.id) ? 'warning' : 'neutral'"
          :variant="isMatchFavorite(match.id) ? 'solid' : 'outline'"
          size="sm"
          @click="toggleMatch(match.id)"
        />
      </div>

      <div class="mt-6">
        <USkeleton
          v-if="streamsLoading"
          class="aspect-video w-full rounded-lg"
        />

        <UEmpty
          v-else-if="streams.length === 0"
          icon="i-lucide-video-off"
          title="No streams available"
          description="No working stream links were returned for this match. Try refreshing or pick another match."
          class="py-12"
        >
          <template #actions>
            <UButton
              label="Refresh streams"
              icon="i-lucide-refresh-cw"
              @click="refreshStreams"
            />
          </template>
        </UEmpty>

        <PlayerFrame
          v-else-if="selectedStream"
          :stream="selectedStream"
          class="block"
        />
      </div>

      <div
        v-if="sortedStreams.length > 0"
        class="mt-6"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-(--ui-text-muted)">
            {{ sortedStreams.length }} stream{{ sortedStreams.length > 1 ? 's' : '' }}
          </h2>
          <UButton
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            label="Refresh"
            @click="refreshStreams"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="stream in sortedStreams"
            :key="`${stream.source}-${stream.id}-${stream.streamNo}`"
            class="group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
            :class="selectedStream?.id === stream.id && selectedStream?.streamNo === stream.streamNo
              ? 'border-(--ui-primary) bg-(--ui-primary)/10 text-(--ui-primary)'
              : 'border-(--ui-border) hover:border-(--ui-text-muted)/30'"
            @click="select(stream)"
          >
            <UIcon
              name="i-lucide-monitor-play"
              class="size-4"
            />
            <span class="font-medium">{{ streamLabel(stream) }}</span>
            <UBadge
              :color="stream.hd ? 'success' : 'neutral'"
              variant="subtle"
              size="xs"
            >
              {{ stream.source }}
            </UBadge>
            <span
              v-if="formatViewers(stream.viewers)"
              class="text-xs text-(--ui-text-muted)"
            >
              {{ formatViewers(stream.viewers) }} watching
            </span>
          </button>
        </div>
      </div>
    </template>

    <UEmpty
      v-else
      icon="i-lucide-video-off"
      title="Match not found"
      description="This match is no longer listed. It may have finished or been removed."
      class="py-12"
    >
      <template #actions>
        <UButton
          label="Back to live matches"
          to="/"
        />
      </template>
    </UEmpty>
  </div>
</template>
