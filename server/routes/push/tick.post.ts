export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.push.tickSecret as string | undefined

  if (!secret || getHeader(event, 'x-tick-secret') !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return await runNotifyCheck()
})
