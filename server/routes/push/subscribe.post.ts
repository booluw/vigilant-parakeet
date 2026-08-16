import type { PushSubscriptionJSON, FavoritesPayload, StoredSubscription } from '../../utils/notify'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    clientId?: string
    subscription?: PushSubscriptionJSON
    favorites?: FavoritesPayload
  }>(event)

  if (!body.clientId || !body.subscription?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing clientId or subscription' })
  }

  const storage = getNotifyStorage()
  const stored: StoredSubscription = {
    subscription: body.subscription,
    favorites: body.favorites ?? { teams: [], matches: [] }
  }

  await storage.setItem(`subs/${body.clientId}`, stored)

  try {
    const live = await fetchLiveMatches()
    await storage.setItem(`state/${body.clientId}`, live.map(m => m.id))
  } catch {
    // state stays absent; the first tick then treats all live matches as already seen
  }

  return { ok: true }
})
