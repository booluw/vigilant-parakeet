const CACHE_TTL = 300_000

let cache: { at: number, categories: string[] } | null = null

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return cache.categories.map(c => ({ id: c, name: c }))
  }

  try {
    const data = await $fetch<any>('https://streamfree.top/api/v1/categories')
    const categories = Array.isArray(data?.categories) ? data.categories : []
    cache = { at: Date.now(), categories }
    return categories.map((c: string) => ({ id: c, name: c }))
  } catch {
    return [
      { id: 'soccer', name: 'soccer' },
      { id: 'basketball', name: 'basketball' },
      { id: 'hockey', name: 'hockey' },
      { id: 'combat', name: 'combat' },
      { id: 'baseball', name: 'baseball' },
      { id: 'football', name: 'football' },
      { id: 'racing', name: 'racing' },
      { id: 'tennis', name: 'tennis' },
      { id: 'cricket', name: 'cricket' }
    ]
  }
})
