<script setup lang="ts">
import type { APIMatch } from '~/types/api'

const props = defineProps<{
  matchId: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { getMatch } = useMatchStore()
const match = ref<APIMatch | null>(null)
const pending = ref(true)

const { streams, loading, selected, sortedStreams, load, select } = useMatchStreams(match)

async function init() {
  pending.value = true
  match.value = await getMatch(props.matchId)
  pending.value = false
  if (match.value) {
    await load()
  }
}

onMounted(init)

watch(() => props.matchId, init)
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-lg border border-(--ui-border) bg-(--ui-bg)">
    <div class="flex items-center justify-between gap-2 border-b border-(--ui-border) px-3 py-2">
      <NuxtLink
        :to="match ? `/match/${match.id}` : '/'"
        class="min-w-0 truncate text-sm font-semibold hover:underline"
        :title="match?.title"
      >
        {{ match?.title ?? 'Loading…' }}
      </NuxtLink>
      <button
        class="grid size-6 shrink-0 place-items-center rounded-md text-(--ui-text-muted) transition hover:bg-(--ui-bg-inverted)/10 hover:text-(--ui-error)"
        aria-label="Remove from multi-view"
        @click="emit('remove', matchId)"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>
    </div>

    <div class="relative aspect-video w-full bg-black">
      <div
        v-if="pending || loading"
        class="absolute inset-0 grid place-items-center"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-6 animate-spin text-(--ui-text-muted)"
        />
      </div>

      <UEmpty
        v-else-if="!match"
        icon="i-lucide-video-off"
        title="Match not found"
        description="It may have finished or been removed."
        class="size-full"
        :ui="{ root: 'justify-center' }"
      />

      <UEmpty
        v-else-if="streams.length === 0"
        icon="i-lucide-video-off"
        title="No streams"
        description="No working streams right now."
        class="size-full"
        :ui="{ root: 'justify-center' }"
      >
        <template #actions>
          <UButton
            size="xs"
            icon="i-lucide-refresh-cw"
            label="Retry"
            @click="load"
          />
        </template>
      </UEmpty>

      <PlayerFrame
        v-else-if="selected"
        :stream="selected"
        class="absolute inset-0"
      />
    </div>

    <div
      v-if="sortedStreams.length > 0"
      class="flex flex-wrap gap-1.5 border-t border-(--ui-border) px-3 py-2"
    >
      <button
        v-for="stream in sortedStreams"
        :key="`${stream.source}-${stream.id}-${stream.streamNo}`"
        class="flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition"
        :class="selected?.id === stream.id && selected?.streamNo === stream.streamNo
          ? 'border-(--ui-primary) bg-(--ui-primary)/10 text-(--ui-primary)'
          : 'border-(--ui-border) hover:border-(--ui-primary)/40'"
        @click="select(stream)"
      >
        <span>{{ stream.source }}</span>
        <UBadge
          :color="stream.hd ? 'success' : 'neutral'"
          variant="subtle"
          size="xs"
        >
          {{ stream.hd ? 'HD' : 'SD' }}
        </UBadge>
      </button>
    </div>
  </div>
</template>
