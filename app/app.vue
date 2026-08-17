<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#1C1C1C' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'S3mTV'
const description = 'Personal live sports streaming app powered by the Streamed API.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          aria-label="S3mTV home"
        >
          <AppLogo class="w-auto" />
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          aria-label="Search matches"
          title="Search matches"
          to="/search"
        />
        <UButton
          icon="i-lucide-layout-grid"
          color="neutral"
          variant="ghost"
          aria-label="Multi-view"
          title="Multi-view"
          to="/multiview"
        />
        <NotificationsBell />
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
