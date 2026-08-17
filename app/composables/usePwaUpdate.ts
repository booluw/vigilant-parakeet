const SW_UPDATE_CHECK = 60 * 60 * 1000 // 1 hour

export function usePwaUpdate() {
  const toast = useToast()
  const updateAvailable = ref(false)

  function promptUpdate() {
    toast.add({
      title: 'Update available',
      description: 'A new version of S3mTV is ready. Reload to update.',
      color: 'info',
      actions: [{
        label: 'Reload',
        color: 'primary',
        click: () => location.reload()
      }],
      duration: 0
    })
  }

  async function checkForUpdate() {
    if (!import.meta.client || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.update()
    } catch {
      // silently ignore update check failures
    }
  }

  function onControllerChange() {
    updateAvailable.value = true
    promptUpdate()
  }

  onMounted(async () => {
    if (!import.meta.client || !('serviceWorker' in navigator)) return

    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return

      if (reg.waiting) {
        updateAvailable.value = true
        promptUpdate()
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            updateAvailable.value = true
            promptUpdate()
          }
        })
      })
    } catch {
      // SW not registered yet
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    // Check for updates periodically
    setInterval(checkForUpdate, SW_UPDATE_CHECK)
    // Also check once on load
    checkForUpdate()
  })

  onScopeDispose(() => {
    if (import.meta.client && 'serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  })

  return { updateAvailable }
}
