<script setup lang="ts">
import type { APIStream } from '~/types/api'

const props = defineProps<{
  stream: APIStream
}>()

const emit = defineEmits<{
  error: []
}>()

const key = computed(() => `${props.stream.source}-${props.stream.id}-${props.stream.streamNo}`)

const status = ref<'loading' | 'loaded' | 'error'>('loading')
let loadTimeout: ReturnType<typeof setTimeout> | null = null

function onLoad() {
  if (status.value === 'loaded') return
  status.value = 'loaded'
  clearLoadTimeout()
}

function onError() {
  status.value = 'error'
  clearLoadTimeout()
  emit('error')
}

function startLoadTimeout() {
  clearLoadTimeout()
  loadTimeout = setTimeout(() => {
    if (status.value === 'loading') {
      status.value = 'error'
      emit('error')
    }
  }, 10_000)
}

function clearLoadTimeout() {
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
}

watch(key, () => {
  status.value = 'loading'
  startLoadTimeout()
}, { immediate: true })

onBeforeUnmount(clearLoadTimeout)
</script>

<template>
  <div class="relative size-full">
    <iframe
      :key="key"
      :src="stream.embedUrl"
      sandbox="allow-scripts allow-same-origin"
      class="size-full border-0"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      frameborder="0"
      scrolling="no"
      @load="onLoad"
      @error="onError"
    />
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex items-center justify-center bg-black"
    >
      <div class="flex flex-col items-center gap-3">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-(--ui-text-muted)"
        />
        <span class="text-sm text-(--ui-text-muted)">Loading stream…</span>
      </div>
    </div>
    <div
      v-if="status === 'error'"
      class="absolute inset-0 flex items-center justify-center bg-black"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <UIcon
          name="i-lucide-alert-circle"
          class="size-8 text-(--ui-error)"
        />
        <div>
          <p class="font-medium text-(--ui-text)">
            Stream unavailable
          </p>
          <p class="mt-1 text-sm text-(--ui-text-muted)">
            Try switching to another stream below.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
