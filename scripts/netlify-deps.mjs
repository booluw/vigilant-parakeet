// Nitro's netlify preset writes .netlify/functions-internal/server/package.json
// with the runtime dependencies it detected. web-push is loaded via createRequire
// (CJS interop), so it isn't detected as a dependency. Netlify doesn't install
// function deps automatically, so:
//  1. declare web-push in the function package.json
//  2. replace nitro's import.meta shim fallback (file:///_entry.js) with the real
//     module URL so createRequire resolves against the function directory
//  3. physically install web-push (and its transitive deps) into the function's
//     node_modules so they are shipped with the deployed function
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const serverDir = join(root, '.netlify', 'functions-internal', 'server')
const serverPkgPath = join(serverDir, 'package.json')

const FALLBACK_IMPORT_META = 'globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env}'
const REAL_IMPORT_META = 'globalThis._importMeta_={url:import.meta.url,env:process.env}'

// Only meaningful for the netlify preset; plain `nuxt build` doesn't produce the function folder.
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

const chunksDir = join(serverDir, 'chunks')
const entryFiles = [join(serverDir, 'main.mjs'), ...(await readdir(chunksDir, { recursive: true }))
  .filter(f => typeof f === 'string' && f.endsWith('.mjs'))
  .map(f => join(chunksDir, f))]
for (const file of entryFiles) {
  const content = await readFile(file, 'utf8')
  if (content.includes(FALLBACK_IMPORT_META)) {
    await writeFile(file, content.replace(FALLBACK_IMPORT_META, REAL_IMPORT_META))
    console.log(`[netlify-deps] patched import.meta shim in ${file.replace(join(serverDir, ''), '')}`)
  }
}

if (!existsSync(join(serverDir, 'node_modules', 'web-push', 'package.json'))) {
  execSync(`npm install --no-save --omit=dev --no-audit --no-fund web-push@${webPushVersion}`, {
    cwd: serverDir,
    stdio: 'inherit'
  })
  console.log(`[netlify-deps] installed web-push@${webPushVersion} into server function node_modules`)
}
