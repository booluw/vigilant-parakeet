<script setup lang="ts">
import type { APIMatchTeam } from '~/types/api'

withDefaults(defineProps<{
  team: APIMatchTeam
  badge?: string
  align?: 'start' | 'end'
}>(), {
  badge: undefined,
  align: 'start'
})
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-2"
    :class="align === 'end' ? 'flex-row-reverse text-right' : 'text-left'"
  >
    <img
      v-if="badge"
      :src="badge"
      :alt="team.name"
      class="size-10 shrink-0 rounded-full bg-white object-contain p-1"
      loading="lazy"
    >
    <span
      v-else
      class="grid size-10 shrink-0 place-items-center rounded-full bg-(--ui-bg-inverted)/10 text-(--ui-text-muted)"
    >
      <UIcon
        name="i-lucide-shield"
        class="size-5"
      />
    </span>
    <span class="line-clamp-2 text-sm font-medium">
      {{ team.name }}
    </span>
  </div>
</template>
