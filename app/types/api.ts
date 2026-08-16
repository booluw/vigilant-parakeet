export interface Sport {
  id: string
  name: string
}

export interface APIMatchTeam {
  name: string
  badge?: string
}

export interface APIMatch {
  id: string
  title: string
  category: string
  date: number
  poster?: string
  popular: boolean
  teams?: {
    home?: APIMatchTeam
    away?: APIMatchTeam
  }
  sources: APIMatchSource[]
}

export interface APIMatchSource {
  source: string
  id: string
}

export interface APIStream {
  id: string
  streamNo: number
  language?: string
  hd: boolean
  embedUrl: string
  source: string
  viewers?: number
}
