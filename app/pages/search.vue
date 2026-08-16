<script setup lang="ts">
import type { APIMatch } from '~/types/api'

type SearchResult = APIMatch & { live: boolean }

useHead({ title: 'Search matches' })

const q = ref('')
const results = ref<SearchResult[]>([])
const searching = ref(false)
const searched = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null

watch(q, (value) => {
  const query = value.trim()
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (query.length < 2) {
    results.value = []
    searched.value = false
    return
  }
  timer = setTimeout(async () => {
    searching.value = true
    try {
      results.value = await $fetch<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`)
      searched.value = true
    } finally {
      searching.value = false
    }
  }, 300)
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <h1 class="text-xl font-bold">
      Search matches
    </h1>
    <p class="mt-1 text-sm text-(--ui-text-muted)">
      Find any team across live and today's scheduled matches — even if they're not live right now.
    </p>

    <UInput
      v-model="q"
      icon="i-lucide-search"
      size="lg"
      placeholder="Search teams…"
      class="mt-4 w-full max-w-md"
      autofocus
    />

    <div class="mt-6">
      <div
        v-if="searching"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton
          v-for="i in 8"
          :key="i"
          class="h-56 w-full rounded-lg"
        />
      </div>

      <UEmpty
        v-else-if="searched && results.length === 0"
        icon="i-lucide-search-x"
        :title="`No matches found for '${q.trim()}'`"
        description="Try another team name — only matches with an available stream are listed."
      />

      <UEmpty
        v-else-if="!searched"
        icon="i-lucide-search"
        title="Start typing to search"
        description="Type at least 2 characters to look up a team across live and today's matches."
      />

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <MatchCard
          v-for="match in results"
          :key="match.id"
          :match="match"
          :status="match.live ? 'live' : 'scheduled'"
        />
      </div>
    </div>
  </div>
</template>
