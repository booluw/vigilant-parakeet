import type { APIMatchTeam } from '~/types/api'

const STORAGE_TEAMS = 's3m-fav-teams'
const STORAGE_MATCHES = 's3m-fav-matches'

export function useFavorites() {
  const favoriteTeams = useState<Record<string, APIMatchTeam>>('fav-teams', () => ({}))
  const favoriteMatches = useState<string[]>('fav-matches', () => [])

  if (import.meta.client) {
    favoriteTeams.value = readStoredJSON(STORAGE_TEAMS, favoriteTeams.value)
    favoriteMatches.value = readStoredJSON(STORAGE_MATCHES, favoriteMatches.value)
  }

  watch(favoriteTeams, (v) => {
    writeStoredJSON(STORAGE_TEAMS, v)
  }, { deep: true })

  watch(favoriteMatches, (v) => {
    writeStoredJSON(STORAGE_MATCHES, v)
  }, { deep: true })

  function toggleTeam(team: APIMatchTeam | undefined) {
    if (!team?.name) return
    const key = team.name.toLowerCase()
    const current = favoriteTeams.value
    if (current[key]) {
      const next: Record<string, APIMatchTeam> = {}
      for (const [k, v] of Object.entries(current)) {
        if (k !== key) next[k] = v
      }
      favoriteTeams.value = next
    } else {
      favoriteTeams.value = { ...current, [key]: { name: team.name, badge: team.badge } }
    }
  }

  function isTeamFavorite(name?: string): boolean {
    return !!name && name.toLowerCase() in favoriteTeams.value
  }

  function toggleMatch(id: string) {
    favoriteMatches.value = favoriteMatches.value.includes(id)
      ? favoriteMatches.value.filter(m => m !== id)
      : [...favoriteMatches.value, id]
  }

  function isMatchFavorite(id: string): boolean {
    return favoriteMatches.value.includes(id)
  }

  return {
    favoriteTeams,
    favoriteMatches,
    toggleTeam,
    isTeamFavorite,
    toggleMatch,
    isMatchFavorite
  }
}
