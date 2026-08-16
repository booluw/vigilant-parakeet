export default defineNitroPlugin(() => {
  if (!import.meta.dev) return

  setInterval(() => {
    runNotifyCheck().catch(() => {})
  }, 60_000)

  runNotifyCheck().catch(() => {})
})
