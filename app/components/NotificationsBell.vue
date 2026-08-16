<script setup lang="ts">
const { status, busy, active, toggle } = useNotifications()
const toast = useToast()

const tooltip = computed(() => {
  switch (status.value) {
    case 'unsupported':
      return 'Notifications not supported — iOS: add the site to your Home Screen, then reopen'
    case 'denied':
      return 'Notifications are blocked in this browser'
    case 'subscribed':
      return 'Notifications on — click to turn off'
    case 'fallback':
      return 'Notifications on while the app is open — click to turn off'
    case 'busy':
      return 'Working…'
    default:
      return 'Turn on notifications'
  }
})

const icon = computed(() => {
  if (status.value === 'denied' || status.value === 'unsupported') return 'i-lucide-bell-off'
  if (active.value) return 'i-lucide-bell-ring'
  return 'i-lucide-bell'
})

async function onClick() {
  if (status.value === 'denied') {
    toast.add({
      title: 'Notifications blocked',
      description: 'Allow notifications for this site in your browser settings.',
      color: 'warning'
    })
    return
  }
  if (status.value === 'unsupported') {
    toast.add({
      title: 'Install the app for notifications',
      description: 'On iPhone/iPad: open this site in Safari, tap Share, then "Add to Home Screen". Then open the app from the Home Screen.',
      color: 'info'
    })
    return
  }
  await toggle()
}
</script>

<template>
  <UButton
    :icon="busy ? 'i-lucide-loader-circle' : icon"
    :class="{ 'animate-spin': busy }"
    color="neutral"
    variant="ghost"
    :aria-label="tooltip"
    :title="tooltip"
    @click="onClick"
  />
</template>
