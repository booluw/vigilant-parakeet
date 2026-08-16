<script setup lang="ts">
import type { APIStream } from '~/types/api'

const props = defineProps<{
  stream: APIStream
}>()

const key = computed(() => `${props.stream.source}-${props.stream.id}-${props.stream.streamNo}`)
</script>

<template>
  <iframe
    :key="key"
    :src="stream.embedUrl"
    class="size-full border-0"
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
    allowfullscreen
    frameborder="0"
    scrolling="no"
  />
</template>
