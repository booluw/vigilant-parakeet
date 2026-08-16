<script setup lang="ts">
import type { APIMatch } from '~/types/api'

useSeoMeta({
  title: 'Multi-view — SportViewer'
})

const { ids, add, remove, clear, max } = useMultiView()
const cols = ref(2)

const { data: liveMatches, refresh } = useFetch<APIMatch[]>('/api/matches/live', { watch: false })

const hasAdminSource = (m: APIMatch) => m.sources.some(s => s.source === 'admin')

const addable = computed(() => (liveMatches.value ?? []).filter(m => hasAdminSource(m) && !ids.value.includes(m.id)))

const search = ref('')

const filteredAddable = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return addable.value
  return addable.value.filter(m => m.title.toLowerCase().includes(q))
})

function pick(id: string) {
  add(id)
  search.value = ''
}
</script>

<template>
  <div class="container mx-auto max-w-7xl px-4 py-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Multi-view
        </h1>
        <p class="mt-1 text-sm text-(--ui-text-muted)">
          {{ ids.length }}/{{ max }} streams · watch up to four matches at once
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <USegmented
          v-model="cols"
          size="sm"
          :items="[
            { label: '1 column', value: 1, icon: 'i-lucide-columns-3' },
            { label: '2 × 2', value: 2, icon: 'i-lucide-layout-grid' }
          ]"
        />
        <UPopover>
          <UButton
            icon="i-lucide-plus"
            label="Add match"
            :disabled="ids.length >= max"
          />
          <template #content>
            <div class="w-80 p-3">
              <UInput
                v-model="search"
                placeholder="Search matches…"
                icon="i-lucide-search"
                size="sm"
                class="mb-2"
              />
              <div class="max-h-80 space-y-1 overflow-y-auto">
                <button
                  v-for="match in filteredAddable"
                  :key="match.id"
                  class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-(--ui-bg-inverted)/10"
                  @click="pick(match.id)"
                >
                  <span class="min-w-0 truncate">{{ match.title }}</span>
                  <UIcon
                    name="i-lucide-plus"
                    class="size-4 shrink-0 text-(--ui-text-muted)"
                  />
                </button>
                <p
                  v-if="filteredAddable.length === 0"
                  class="px-2 py-4 text-center text-sm text-(--ui-text-muted)"
                >
                  {{ search ? 'No matches match your search.' : 'No matches with an active stream left to add.' }}
                </p>
              </div>
            </div>
          </template>
        </UPopover>
        <UButton
          v-if="ids.length > 0"
          icon="i-lucide-trash-2"
          label="Clear"
          color="neutral"
          variant="subtle"
          @click="clear"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="subtle"
          aria-label="Refresh live matches"
          @click="() => refresh()"
        />
      </div>
    </div>

    <UEmpty
      v-if="ids.length === 0"
      icon="i-lucide-layout-grid"
      title="No streams yet"
      description="Add up to four matches and watch them side by side."
      class="mt-12 py-12"
    />

    <div
      v-else
      class="mt-6 grid gap-4"
      :class="cols === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'"
    >
      <MultiViewCell
        v-for="id in ids"
        :key="id"
        :match-id="id"
        @remove="remove"
      />
    </div>
  </div>
</template>
