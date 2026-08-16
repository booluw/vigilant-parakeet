const EMBED_BASE = 'https://embed.st'

const M3U8_REGEX = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const { source, id, streamNo } = params

  if (!source || !id || !streamNo) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stream parameters' })
  }

  const embedUrl = `${EMBED_BASE}/embed/${source}/${id}/${streamNo}`

  try {
    const page = await $fetch<string>(embedUrl)

    const urls = new Set<string>()
    for (const match of page.matchAll(M3U8_REGEX)) {
      urls.add(match[0].replace(/\\u002F/g, '/'))
    }

    const scriptSrcs = [...page.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1])
    for (const src of scriptSrcs) {
      if (src && (src.includes('bundle') || src.includes('player') || src.includes('main'))) {
        try {
          const js = await $fetch<string>(src)
          for (const match of js.matchAll(M3U8_REGEX)) {
            urls.add(match[0].replace(/\\u002F/g, '/'))
          }
        } catch {
          // best-effort: ignore scripts we cannot fetch
        }
      }
    }

    return {
      embedUrl,
      url: urls.size > 0 ? [...urls][0] : null
    }
  } catch {
    return {
      embedUrl,
      url: null
    }
  }
})
