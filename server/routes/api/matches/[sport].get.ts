import type { APIMatch } from '../../../../app/types/api'

const CACHE_TTL = 30_000

let cache: { at: number, matches: APIMatch[] } | null = null

function mapStreamfreeToMatch(s: any): APIMatch {
  const home = s.team1?.name ? { name: s.team1.name, badge: s.team1.logo } : undefined
  const away = s.team2?.name ? { name: s.team2.name, badge: s.team2.logo } : undefined

  return {
    id: s.stream_key || s.id,
    title: s.name,
    category: s.category,
    date: s.match_timestamp ? s.match_timestamp * 1000 : Date.now(),
    poster: s.thumbnail_url,
    popular: (s.viewers || 0) > 1000,
    teams: home || away ? { home, away } : undefined,
    sources: [
      { source: s.category, id: s.stream_key || s.id }
    ]
  }
}

export default defineEventHandler(async (event) => {
  const sport = getRouterParams(event).sport
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    if (sport === 'all') return cache.matches
    return cache.matches.filter(m => m.category === sport)
  }

  try {
    const data = await $fetch<any>('https://streamfree.top/api/v1/streams')
    const streams = Array.isArray(data?.streams) ? data.streams : []
    const matches = streams.map(mapStreamfreeToMatch)
    cache = { at: Date.now(), matches }
    if (sport === 'all') return matches
    return matches.filter(m => m.category === sport)
  } catch {
    return []
  }
})
