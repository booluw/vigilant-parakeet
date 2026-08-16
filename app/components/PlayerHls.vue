<script setup lang="ts">
import type { APIStream } from '~/types/api'

const props = defineProps<{
  stream: APIStream
}>()

const emit = defineEmits<{
  fallback: []
}>()

const video = ref<HTMLVideoElement | null>(null)
const status = ref<'loading' | 'playing' | 'error'>('loading')

watch(
  () => [props.stream.source, props.stream.id, props.stream.streamNo],
  () => init(),
  { immediate: true }
)

async function init() {
  status.value = 'loading'
  try {
    const res = await $fetch<{ url: string | null, embedUrl: string }>(
      hlsUrl(props.stream.source, props.stream.id, props.stream.streamNo)
    )

    if (!res.url) {
      emit('fallback')
      return
    }

    await nextTick()

    const el = video.value
    if (!el) return

    const { default: Hls } = await import('hls.js')
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(res.url)
      hls.attachMedia(el)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          emit('fallback')
        }
      })
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = res.url
    } else {
      emit('fallback')
    }
  } catch {
    emit('fallback')
  }
}
</script>

<template>
  <div class="relative grid size-full place-items-center bg-black">
    <video
      ref="video"
      class="size-full"
      controls
      autoplay
      playsinline
      @playing="status = 'playing'"
      @error="status = 'error'; emit('fallback')"
    />

    <div
      v-if="status === 'loading'"
      class="absolute flex flex-col items-center gap-3 text-(--ui-text-muted)"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin"
      />
      <span class="text-sm">Resolving experimental stream…</span>
    </div>
  </div>
</template>
