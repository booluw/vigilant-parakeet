import type { APIStream } from '../../../../app/types/api'

export default defineEventHandler(async (event) => {
  const { source, id } = getRouterParams(event)

  if (!source || !id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing parameters' })
  }

  try {
    const data = await $fetch<any>(`https://streamfree.top/api/v1/sources/${id}`)
    const sources = Array.isArray(data?.sources) ? data.sources : []
    const live = Array.isArray(data?.live_sources) ? data.live_sources : sources

    const streams: APIStream[] = sources.map((url: string, idx: number) => {
      const m = url.match(/(\d+p)(\d*)$/)
      const label = m?.[1] || '1080p'
      const hd = label.includes('1080')
      const streamNo = idx + 1

      return {
        id: String(id),
        streamNo,
        language: undefined,
        hd,
        embedUrl: url,
        source: String(source),
        viewers: undefined
      }
    })

    if (streams.length === 0) {
      return []
    }

    if (live.length > 0) {
      const liveSet = new Set(live)
      const prioritized = streams.filter(s => liveSet.has(s.embedUrl))
      if (prioritized.length > 0) {
        return prioritized
      }
    }

    return streams
  } catch {
    return []
  }
})
