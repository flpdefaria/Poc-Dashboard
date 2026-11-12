#!/usr/bin/env node
/**
 * Measure a scenario's real render without writing ad-hoc Playwright scripts.
 *
 *   npm run visual:measure -- <id>[,<id>…] --sel "<css>" [--sel "<css>"…] [--props color,width]
 *   npm run visual:measure -- <id>[,<id>…] --probe path/to/probe.mjs     custom probe: export default async (page, scenario) => json
 *   … [--out file.json]                                                 also keep the JSON (e.g. in <bundle>/evidence/)
 *
 * The scenario opens exactly as in the capture (mocks, clock, theme, viewport, actions); the preview
 * server on 5175 is started or reused. Prints one JSON document on stdout; Playwright logs go to stderr.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_APP = path.resolve(HERE, '..')

function usage(message) {
  if (message) console.error(`[visual:measure] ${message}`)
  console.error('Usage: npm run visual:measure -- <id>[,<id>…] (--sel "<css>"… [--props a,b] | --probe <file.mjs>) [--out <file.json>]')
  process.exit(2)
}

const args = process.argv.slice(2)
const ids = []
const selectors = []
let probe = null
let props = ''
let out = null
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--sel') selectors.push(args[++i] ?? usage('--sel needs a value'))
  else if (a === '--probe') probe = args[++i] ?? usage('--probe needs a value')
  else if (a === '--props') props = args[++i] ?? usage('--props needs a value')
  else if (a === '--out') out = args[++i] ?? usage('--out needs a value')
  else if (a === '-h' || a === '--help') usage()
  else if (a.startsWith('-')) usage(`Unknown flag ${a}`)
  else ids.push(...a.split(',').map((s) => s.trim()).filter(Boolean))
}
if (!ids.length) usage('No scenario id.')
if (!probe && !selectors.length) usage('Give --sel selectors or a --probe module.')

const probePath = probe ? path.resolve(probe) : path.join(HERE, 'probes', 'elements.mjs')
if (!fs.existsSync(probePath)) usage(`Probe not found: ${probePath}`)
const tmpOut = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'visual-measure-')), 'result.json')

const code = await new Promise((resolve) => {
  const child = spawn('npx', ['playwright', 'test', '-c', 'visual/measure.config.ts'], {
    cwd: CLIENT_APP,
    stdio: ['ignore', 2, 2],
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VISUAL_MEASURE_IDS: ids.join(','),
      VISUAL_MEASURE_PROBE: probePath,
      VISUAL_MEASURE_OUT: tmpOut,
      VISUAL_MEASURE_SELECTORS: JSON.stringify(selectors),
      VISUAL_MEASURE_PROPS: props,
    },
  })
  child.on('exit', (c) => resolve(c ?? 1))
  child.on('error', (e) => { console.error(`[visual:measure] ${e.message}`); resolve(1) })
})

const result = fs.existsSync(tmpOut) ? fs.readFileSync(tmpOut, 'utf8') : '{}\n'
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
  fs.writeFileSync(path.resolve(out), result)
}
process.stdout.write(result)
process.exit(code)
