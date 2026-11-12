#!/usr/bin/env node
/**
 * Scenario ids for one screen, comma-joined for visual:compare / visual:recheck.
 *
 *   npm run visual:ids -- orders          every orders-* scenario (light and dark)
 *   npm run visual:ids -- orders --light  light only
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const prefix = args.find((a) => !a.startsWith('-'))
const theme = args.includes('--light') ? 'light' : args.includes('--dark') ? 'dark' : null
if (!prefix) {
  console.error('Usage: npm run visual:ids -- <screen-prefix> [--light|--dark]')
  process.exit(2)
}
const res = spawnSync('npx', ['playwright', 'test', 'visual/capture.spec.ts', '--list'], {
  cwd: CLIENT_APP, encoding: 'utf8', shell: process.platform === 'win32',
})
const re = new RegExp(`\\b(${prefix.replace(/[^a-z0-9-]/gi, '')}-[a-z0-9-]+-(light|dark))\\b`, 'g')
const ids = [...new Set([...(res.stdout ?? '').matchAll(re)].map((m) => m[1]))]
  .filter((id) => !theme || id.endsWith(`-${theme}`))
  .sort()
if (!ids.length) {
  console.error(`[visual:ids] no scenario starts with "${prefix}-"`)
  process.exit(1)
}
console.log(ids.join(','))
