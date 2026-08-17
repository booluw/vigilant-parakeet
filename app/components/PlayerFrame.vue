<script setup lang="ts">
import type { APIStream } from '~/types/api'

const props = defineProps<{
  stream: APIStream
}>()

const engine = ref<'iframe' | 'hls'>('iframe')
const hlsFellBack = ref(false)
const iframeFailed = ref(false)
const toast = useToast()

onMounted(() => {
  const saved = localStorage.getItem('s3m-player-engine')
  if (saved === 'hls' || saved === 'iframe') {
    engine.value = saved
  }
})

watch(engine, (v) => {
  localStorage.setItem('s3m-player-engine', v)
})

watch(() => props.stream, () => {
  iframeFailed.value = false
  hlsFellBack.value = false
})

function onHlsFallback() {
  engine.value = 'iframe'
  hlsFellBack.value = true
  toast.add({
    title: 'Experimental player unavailable',
    description: 'Fell back to the embedded player.',
    color: 'warning'
  })
}

function onIframeError() {
  if (iframeFailed.value) return
  iframeFailed.value = true
  toast.add({
    title: 'Stream unavailable',
    description: 'The embed failed to load. Try switching to another stream.',
    color: 'warning'
  })
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  toast.add({ title: 'Link copied', color: 'success' })
}
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <UBadge
        :color="stream.hd ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ streamLabel(stream) }}
      </UBadge>

      <div class="flex items-center gap-2">
        <USegmented
          v-model="engine"
          size="xs"
          :items="[{
            label: 'Embed',
            value: 'iframe',
            icon: 'i-lucide-box'
          }, {
            label: 'HLS (experimental)',
            value: 'hls',
            icon: 'i-lucide-flask-conical'
          }]"
        />
        <UButton
          icon="i-lucide-link"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Copy link"
          @click="copyLink"
        />
      </div>
    </div>

    <div class="aspect-video w-full overflow-hidden rounded-lg border border-(--ui-border) bg-black">
      <PlayerIframe
        v-if="engine === 'iframe'"
        :stream="stream"
        @error="onIframeError"
      />
      <PlayerHls
        v-else
        :stream="stream"
        @fallback="onHlsFallback"
      />
    </div>

    <p
      v-if="hlsFellBack"
      class="mt-2 text-xs text-(--ui-text-muted)"
    >
      The HLS resolver is experimental and could not extract a direct stream URL for this source.
    </p>
  </div>
</template>
