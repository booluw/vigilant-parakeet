export default defineEventHandler(async (event) => {
  const body = await readBody<{ clientId?: string }>(event)

  if (!body.clientId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing clientId' })
  }

  const storage = getNotifyStorage()
  await storage.removeItem(`subs/${body.clientId}`)
  await storage.removeItem(`state/${body.clientId}`)

  return { ok: true }
})
