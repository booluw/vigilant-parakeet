import type { APIMatch } from '../../app/types/api'

const STREAMED_API = 'https://streamed.pk'
const CACHE_TTL = 30_000

interface SearchMatch extends APIMatch {
  live: boolean
}

let cache: { at: number, matches: SearchMatch[] } | null = null

async function fetchSearchable(): Promise<SearchMatch[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return cache.matches
  }
  const [today, live] = await Promise.all([
    $fetch<APIMatch[]>(`${STREAMED_API}/api/matches/all-today`),
    $fetch<APIMatch[]>(`${STREAMED_API}/api/matches/live`)
  ])
  const liveIds = new Set((live ?? []).map(m => m.id))
  const matches = (today ?? []).map(m => ({ ...m, live: liveIds.has(m.id) }))
  cache = { at: Date.now(), matches }
  return matches
}

export default defineEventHandler(async (event) => {
  const q = (getQuery(event).q as string | undefined ?? '').trim().toLowerCase()
  if (q.length < 2) return []

  let matches: SearchMatch[]
  try {
    matches = await fetchSearchable()
  } catch {
    return []
  }

  return matches
    .filter(m => m.sources.some(s => s.source === 'admin'))
    .filter((m) => {
      if (m.title.toLowerCase().includes(q)) return true
      const names = [m.teams?.home?.name, m.teams?.away?.name]
      return names.some(n => !!n && n.toLowerCase().includes(q))
    })
    .slice(0, 24)
})
