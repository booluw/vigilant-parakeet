// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Nitro } from 'nitropack'

const rootPkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { dependencies?: Record<string, string> }
const webPushVersion = rootPkg.dependencies?.['web-push']

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
        ? { driver: 'netlify-blobs', name: 'sv-notifications' }
        : { driver: 'fs', base: join(process.cwd(), '.data', 'notifications') }
    }
  },

  hooks: {
    'nitro:init'(nitro: Nitro) {
      // web-push is loaded via createRequire and never traced into the
      // serverless function's dependencies, so inject it explicitly into
      // the generated function package.json for the netlify preset. This is
      // registered additively (not via nitro.hooks config) so the preset's
      // own `compiled` hook — which writes the function's server.mjs entry
      // and its `path: "/*"` routing config — is preserved.
      nitro.hooks.hook('compiled', async () => {
        const serverPkgPath = join(nitro.options.output.dir, 'server', 'package.json')
        if (!existsSync(serverPkgPath) || !webPushVersion) return
        const pkg = JSON.parse(await readFile(serverPkgPath, 'utf8')) as { dependencies?: Record<string, string> }
        pkg.dependencies = pkg.dependencies || {}
        if (!pkg.dependencies['web-push']) {
          pkg.dependencies['web-push'] = webPushVersion
          await writeFile(serverPkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
          console.log(`[nitro] injected web-push@${webPushVersion} into server function deps`)
        }
      })
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
