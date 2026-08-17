// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Nitro } from 'nitropack'

const FALLBACK_IMPORT_META = 'globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env}'
const REAL_IMPORT_META = 'globalThis._importMeta_={url:import.meta.url,env:process.env}'

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
        ? { driver: 'netlify-blobs', name: 's3m-notifications' }
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
        if (nitro.options.preset !== 'netlify' || !webPushVersion) return
        const serverDir = join(nitro.options.output.dir, 'server')
        const serverPkgPath = join(serverDir, 'package.json')
        if (!existsSync(serverPkgPath)) return

        const pkg = JSON.parse(await readFile(serverPkgPath, 'utf8')) as { dependencies?: Record<string, string> }
        pkg.dependencies = pkg.dependencies || {}
        if (!pkg.dependencies['web-push']) {
          pkg.dependencies['web-push'] = webPushVersion
          await writeFile(serverPkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
          console.log(`[nitro] injected web-push@${webPushVersion} into server function deps`)
        }

        const chunksDir = join(serverDir, 'chunks')
        const entryFiles = [join(serverDir, 'main.mjs'), ...(await readdir(chunksDir, { recursive: true }))
          .filter(f => typeof f === 'string' && f.endsWith('.mjs'))
          .map(f => join(chunksDir, f))]
        for (const file of entryFiles) {
          const content = await readFile(file, 'utf8')
          if (content.includes(FALLBACK_IMPORT_META)) {
            await writeFile(file, content.replace(FALLBACK_IMPORT_META, REAL_IMPORT_META))
            console.log(`[nitro] patched import.meta shim in ${file.replace(join(nitro.options.output.dir, 'server', ''), '')}`)
          }
        }

        if (!existsSync(join(serverDir, 'node_modules', 'web-push', 'package.json'))) {
          execSync(`npm install --no-save --omit=dev --no-audit --no-fund web-push@${webPushVersion}`, {
            cwd: serverDir,
            stdio: 'inherit'
          })
          console.log(`[nitro] installed web-push@${webPushVersion} into server function node_modules`)
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
