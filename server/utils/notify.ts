import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const webpush = require('web-push') as typeof import('web-push')

const STREAMED_API = 'https://streamed.pk'

export interface PushSubscriptionJSON {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface FavoritesPayload {
  teams: string[]
  matches: string[]
}

export interface StoredSubscription {
  subscription: PushSubscriptionJSON
  favorites: FavoritesPayload
}

export interface LiveMatch {
  id: string
  title: string
  category?: string
  teams?: {
    home?: { name?: string }
    away?: { name?: string }
  } | null
}

export function getNotifyStorage() {
  return useStorage('notifications')
}

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const data = await $fetch<LiveMatch[]>(`${STREAMED_API}/api/matches/live`)
  return Array.isArray(data) ? data : []
}

function configureVapid(): boolean {
  const config = useRuntimeConfig()
  const publicKey = config.push.vapidPublic as string | undefined
  const privateKey = config.push.vapidPrivate as string | undefined
  if (!publicKey || !privateKey) return false
  let contact = (config.push.contactEmail as string | undefined) || 'mailto:admin@example.com'
  if (!contact.startsWith('mailto:') && !contact.startsWith('https://')) {
    contact = `mailto:${contact}`
  }
  webpush.setVapidDetails(contact, publicKey, privateKey)
  return true
}

interface TeamInterest {
  type: 'team'
  teamName: string
  opposition: string
}

interface MatchInterest {
  type: 'match'
}

type MatchInterest = TeamInterest | MatchInterest | null

function getMatchInterest(match: LiveMatch, favorites: FavoritesPayload): MatchInterest {
  const home = match.teams?.home?.name
  const away = match.teams?.away?.name

  const homeLower = home?.toLowerCase()
  const awayLower = away?.toLowerCase()

  if (homeLower && favorites.teams.some(t => t.toLowerCase() === homeLower)) {
    return { type: 'team', teamName: home, opposition: away || 'TBD' }
  }

  if (awayLower && favorites.teams.some(t => t.toLowerCase() === awayLower)) {
    return { type: 'team', teamName: away, opposition: home || 'TBD' }
  }

  if (favorites.matches.includes(match.id)) {
    return { type: 'match' }
  }

  return null
}

function composeNotification(match: LiveMatch, interest: MatchInterest): { title: string, body: string } {
  const home = match.teams?.home?.name || 'Home'
  const away = match.teams?.away?.name || 'Away'

  if (interest?.type === 'team') {
    return {
      title: `Your team ${interest.teamName} is about to play ${interest.opposition}.`,
      body: 'Come and cheer them on!'
    }
  }

  return {
    title: `${home} vs. ${away} is about to start.`,
    body: 'Grab your virtual stadium seat.'
  }
}

type SendResult = 'sent' | 'expired' | 'error'

async function sendPush(
  subscription: PushSubscriptionJSON,
  payload: { title: string, body?: string, data?: Record<string, unknown>, tag?: string }
): Promise<SendResult> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'sent'
  } catch (err) {
    if (typeof err === 'object' && err && 'statusCode' in err) {
      const code = (err as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) return 'expired'
    }
    return 'error'
  }
}

export interface NotifyResult {
  sent: number
  subs: number
  upstreamError: boolean
}

export async function runNotifyCheck(): Promise<NotifyResult> {
  const storage = getNotifyStorage()
  const result: NotifyResult = { sent: 0, subs: 0, upstreamError: false }

  if (!configureVapid()) return result

  let live: LiveMatch[]
  try {
    live = await fetchLiveMatches()
  } catch {
    result.upstreamError = true
    return result
  }

  const liveIds = live.map(m => m.id)
  const keys = await storage.getKeys('subs/')
  result.subs = keys.length

  for (const key of keys) {
    const clientId = key.replace(/^subs\//, '')
    const stored = await storage.getItem<StoredSubscription>(key)
    if (!stored?.subscription?.endpoint) continue

    const stateKey = `state/${clientId}`
    const seen = (await storage.getItem<string[]>(stateKey)) ?? []

    const newly = seen.length === 0
      ? []
      : live.filter((m) => {
          if (seen.includes(m.id)) return false
          return getMatchInterest(m, stored.favorites) !== null
        })

    let expired = false
    for (const match of newly) {
      const interest = getMatchInterest(match, stored.favorites)
      if (!interest) continue
      const { title, body } = composeNotification(match, interest)
      const outcome = await sendPush(stored.subscription, {
        title,
        body,
        tag: `live-${match.id}`,
        data: { url: `/match/${match.id}` }
      })
      if (outcome === 'sent') {
        result.sent++
      } else if (outcome === 'expired') {
        expired = true
        break
      }
    }

    if (expired) {
      await storage.removeItem(key)
      await storage.removeItem(stateKey)
      result.subs--
      continue
    }

    await storage.setItem(stateKey, liveIds)
  }

  return result
}
