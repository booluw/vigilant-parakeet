<script setup lang="ts">
import type { APIMatch } from '~/types/api'

const props = withDefaults(defineProps<{
  match: APIMatch
  status?: 'live' | 'scheduled'
}>(), {
  status: 'live'
})

const { setMatch } = useMatchStore()
const { toggleTeam, isTeamFavorite, toggleMatch, isMatchFavorite } = useFavorites()

const home = computed(() => props.match.teams?.home)
const away = computed(() => props.match.teams?.away)
const homeBadge = computed(() => badgeImage(home.value?.badge))
const awayBadge = computed(() => badgeImage(away.value?.badge))

function open() {
  setMatch(props.match)
  navigateTo(`/match/${props.match.id}`)
}
</script>

<template>
  <UCard
    class="cursor-pointer transition hover:-translate-y-0.5 hover:border-(--ui-primary)/40"
    :ui="{ body: 'p-0' }"
    @click="open"
  >
    <div class="relative h-28 overflow-hidden bg-(--ui-bg-elevated)">
      <img
        v-if="match.poster"
        :src="match.poster"
        :alt="match.title"
        class="size-full object-cover opacity-40"
        loading="lazy"
      >
      <div class="absolute inset-0 flex items-center justify-center gap-4 px-4">
        <div class="flex min-w-0 items-center gap-1.5">
          <TeamBadge
            v-if="home"
            :team="home"
            :badge="homeBadge"
            :align="'end'"
          />
          <button
            v-if="home"
            class="grid size-5 shrink-0 place-items-center rounded-full text-(--ui-text-muted) transition hover:text-yellow-400"
            :class="{ 'text-yellow-400': isTeamFavorite(home.name) }"
            :aria-label="`${isTeamFavorite(home.name) ? 'Unfavorite' : 'Favorite'} ${home.name}`"
            @click.stop="toggleTeam(home)"
          >
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
          </button>
        </div>
        <span class="text-sm font-bold text-(--ui-text-muted)">vs</span>
        <div class="flex min-w-0 items-center gap-1.5">
          <button
            v-if="away"
            class="grid size-5 shrink-0 place-items-center rounded-full text-(--ui-text-muted) transition hover:text-yellow-400"
            :class="{ 'text-yellow-400': isTeamFavorite(away.name) }"
            :aria-label="`${isTeamFavorite(away.name) ? 'Unfavorite' : 'Favorite'} ${away.name}`"
            @click.stop="toggleTeam(away)"
          >
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
          </button>
          <TeamBadge
            v-if="away"
            :team="away"
            :badge="awayBadge"
            :align="'start'"
          />
        </div>
      </div>
      <div class="absolute top-2 left-2 flex gap-1">
        <UBadge
          v-if="status === 'live'"
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
          v-else
          color="neutral"
          variant="subtle"
        >
          Starts {{ matchTime(match.date) }}
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
      <div class="absolute top-2 right-2">
        <button
          class="grid size-7 place-items-center rounded-full bg-(--ui-bg)/80 text-(--ui-text-muted) backdrop-blur transition hover:text-yellow-400"
          :class="{ 'text-yellow-400': isMatchFavorite(match.id) }"
          :aria-label="`${isMatchFavorite(match.id) ? 'Unstar' : 'Star'} ${match.title}`"
          :title="`${isMatchFavorite(match.id) ? 'Unstar' : 'Star'} match`"
          @click.stop="toggleMatch(match.id)"
        >
          <UIcon
            name="i-lucide-star"
            class="size-4"
          />
        </button>
      </div>
    </div>

    <div class="p-4">
      <h3
        class="line-clamp-1 font-semibold"
        :title="match.title"
      >
        {{ match.title }}
      </h3>
      <div class="mt-1.5 flex items-center gap-3 text-sm text-(--ui-text-muted)">
        <span>{{ matchDate(match.date) }}</span>
        <span class="text-(--ui-border)">•</span>
        <span>{{ match.category }}</span>
      </div>
    </div>
  </UCard>
</template>
