// Nitro's netlify preset writes .netlify/functions-internal/server/package.json
// with the runtime dependencies it detected. web-push is loaded via createRequire
// (CJS interop), so it isn't detected as a dependency. Netlify installs only the
// deps listed in that file for the function, so inject web-push explicitly.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const serverPkgPath = join(root, '.netlify', 'functions-internal', 'server', 'package.json')

// Only meaningful for the netlify preset; plain `nuxt build` doesn't produce the function folder.
const { existsSync } = await import('node:fs')
if (!existsSync(serverPkgPath)) {
  console.log('[netlify-deps] no netlify function output found — skipping')
  process.exit(0)
}

const webPushVersion = require('../package.json').dependencies['web-push']

const pkg = JSON.parse(await readFile(serverPkgPath, 'utf8'))
pkg.dependencies = pkg.dependencies || {}
pkg.dependencies['web-push'] = webPushVersion
await writeFile(serverPkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`[netlify-deps] injected web-push@${webPushVersion} into server function deps`)
