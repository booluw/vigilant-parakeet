import type { Sport, APIStream } from '~/types/api'

export const API_IMAGE_BADGE = '/api/images/badge'

export function badgeImage(badge?: string): string | undefined {
  return badge ? `${API_IMAGE_BADGE}/${badge}.webp` : undefined
}

export function streamUrl(source: string, id: string): string {
  return `/api/stream/${source}/${id}`
}

export function hlsUrl(source: string, id: string, streamNo: number): string {
  return `/hls/${source}/${id}/${streamNo}`
}

export function matchTime(date: number): string {
  return new Date(date).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function matchDate(date: number): string {
  const today = new Date()
  const d = new Date(date)
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d)
  }
  return matchTime(date)
}

export function formatViewers(viewers?: number): string | undefined {
  if (viewers === undefined || viewers === null) return undefined
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(viewers)
}

export function sportName(category: string, sports: Sport[]): string {
  return sports.find(s => s.id === category)?.name ?? category
}

export function streamLabel(stream: APIStream, sport = ''): string {
  const parts = [stream.language ?? sport, stream.hd ? 'HD' : 'SD'].filter(Boolean)
  return parts.join(' · ')
}
