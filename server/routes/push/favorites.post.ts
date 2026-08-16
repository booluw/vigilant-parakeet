import type { FavoritesPayload, StoredSubscription } from '../../utils/notify'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    clientId?: string
    favorites?: FavoritesPayload
  }>(event)

  if (!body.clientId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing clientId' })
  }

  const storage = getNotifyStorage()
  const key = `subs/${body.clientId}`
  const stored = await storage.getItem<StoredSubscription>(key)
  if (!stored) {
    return { ok: false, reason: 'no-subscription' }
  }

  await storage.setItem(key, {
    ...stored,
    favorites: body.favorites ?? { teams: [], matches: [] }
  })

  return { ok: true }
})
