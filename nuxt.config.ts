// https://nuxt.com/docs/api/configuration/nuxt-config
import { join } from 'node:path'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    push: {
      tickSecret: process.env.NUXT_PUSH_TICK_SECRET ?? '',
      vapidPublic: process.env.NUXT_PUSH_VAPID_PUBLIC ?? '',
      vapidPrivate: process.env.NUXT_PUSH_VAPID_PRIVATE ?? '',
      contactEmail: process.env.NUXT_PUSH_CONTACT_EMAIL ?? ''
    },
    public: {
      pushPublicKey: process.env.NUXT_PUBLIC_PUSH_PUBLIC_KEY ?? ''
    }
  },

  routeRules: {
    '/api/**': { proxy: 'https://streamed.pk/api/**' }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    storage: {
      notifications: (process.env.NITRO_PRESET === 'netlify' || process.env.NETLIFY === 'true')
        ? { driver: 'netlify-blobs', options: { name: 'sv-notifications' } }
        : { driver: 'fs', base: join(process.cwd(), '.data', 'notifications') }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: true,
      icons: [
        'lucide:tv-minimal-play',
        'lucide:search',
        'lucide:search-x',
        'lucide:refresh-cw',
        'lucide:flame',
        'lucide:shield',
        'lucide:loader-circle',
        'lucide:monitor-play',
        'lucide:video-off',
        'lucide:arrow-left',
        'lucide:link',
        'lucide:box',
        'lucide:flask-conical',
        'lucide:tv',
        'lucide:star',
        'lucide:x',
        'lucide:radio-tower',
        'lucide:calendar-clock',
        'lucide:layout-grid',
        'lucide:columns-3',
        'lucide:trash-2',
        'lucide:plus',
        'lucide:bell',
        'lucide:bell-ring',
        'lucide:bell-off'
      ]
    }
  }
})
