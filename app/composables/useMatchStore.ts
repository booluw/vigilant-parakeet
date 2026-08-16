import type { APIMatch } from '~/types/api'

export function useMatchStore() {
  const selectedMatch = useState<APIMatch | null>('selected-match', () => null)

  function setMatch(match: APIMatch | null) {
    selectedMatch.value = match
  }

  async function getMatch(id: string): Promise<APIMatch | null> {
    if (selectedMatch.value?.id === id) {
      return selectedMatch.value
    }
    try {
      const matches = await $fetch<APIMatch[]>('/api/matches/all')
      const match = matches.find(m => m.id === id) ?? null
      setMatch(match)
      return match
    } catch {
      return null
    }
  }

  return {
    match: selectedMatch,
    setMatch,
    getMatch
  }
}
