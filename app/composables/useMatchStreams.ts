import type { APIMatch, APIStream } from '~/types/api'

function score(stream: APIStream): number {
  let s = 0
  if (stream.hd) s += 4
  if (stream.language?.toLowerCase().includes('english')) s += 3
  s += Math.min(stream.viewers ?? 0, 100) / 100
  return s
}

function best(list: APIStream[]): APIStream | null {
  return [...list].sort((a, b) => score(b) - score(a))[0] ?? null
}

export function useMatchStreams(match: Ref<APIMatch | null>) {
  const streams = ref<APIStream[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selected = ref<APIStream | null>(null)

  const sortedStreams = computed(() =>
    [...streams.value].sort((a, b) => {
      const sourceDiff = a.source.localeCompare(b.source)
      if (sourceDiff !== 0) return sourceDiff
      return score(b) - score(a)
    })
  )

  async function load() {
    if (!match.value) return
    loading.value = true
    error.value = null
    try {
      const results = await Promise.allSettled(
        match.value.sources.map(s => $fetch<APIStream[]>(streamUrl(s.source, s.id)))
      )
      streams.value = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
      selected.value = best(streams.value)
    } catch {
      error.value = 'Failed to load streams for this match.'
    } finally {
      loading.value = false
    }
  }

  function select(stream: APIStream) {
    selected.value = stream
  }

  return {
    streams,
    loading,
    error,
    selected,
    sortedStreams,
    load,
    select
  }
}
