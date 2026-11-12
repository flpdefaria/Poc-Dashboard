#!/usr/bin/env node
/**
 * What did a correction change? Diff a scenario's capture between two attempts of one bundle.
 *
 *   npm run visual:attempt-diff -- <bundle> <scenario-id> [--from N] [--to M] [--delta 8]
 *
 * Defaults: --to = latest attempt with that capture, --from = the one before it. A pixel counts as
 * changed when any channel differs by more than --delta (8 filters dark toast/backdrop raster noise).
 * Prints JSON { changedPixels, bbox, diffImage } and writes the diff next to the later capture.
 */
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const args = process.argv.slice(2)
let from = null, to = null, delta = 8
const pos = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from') from = Number(args[++i])
  else if (args[i] === '--to') to = Number(args[++i])
  else if (args[i] === '--delta') delta = Number(args[++i])
  else pos.push(args[i])
}
if (pos.length !== 2) {
  console.error('Usage: npm run visual:attempt-diff -- <bundle> <scenario-id> [--from N] [--to M] [--delta 8]')
  process.exit(2)
}
const [bundle, id] = pos
const dir = (n) => path.join(bundle, 'actual', `attempt-${String(n).padStart(2, '0')}`)
const available = fs.existsSync(path.join(bundle, 'actual'))
  ? fs.readdirSync(path.join(bundle, 'actual'))
      .map((d) => /^attempt-(\d+)$/.exec(d)?.[1]).filter(Boolean).map(Number)
      .filter((n) => fs.existsSync(path.join(dir(n), `${id}.png`))).sort((a, b) => a - b)
  : []
to ??= available.at(-1)
from ??= available.filter((n) => n < to).at(-1)
if (from == null || to == null) {
  console.error(`[visual:attempt-diff] need two attempts with ${id}.png; found: ${available.join(', ') || 'none'}`)
  process.exit(1)
}
const a = PNG.sync.read(fs.readFileSync(path.join(dir(from), `${id}.png`)))
const b = PNG.sync.read(fs.readFileSync(path.join(dir(to), `${id}.png`)))
if (a.width !== b.width || a.height !== b.height) {
  console.log(JSON.stringify({ from, to, dimensionChange: { from: `${a.width}x${a.height}`, to: `${b.width}x${b.height}` } }, null, 2))
  process.exit(0)
}
const d = new PNG({ width: a.width, height: a.height })
let changed = 0, x1 = Infinity, y1 = Infinity, x2 = -1, y2 = -1
for (let y = 0; y < a.height; y++) {
  for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4
    const diff = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]))
    if (diff > delta) {
      changed++; x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y)
      d.data[i] = 255; d.data[i + 1] = 0; d.data[i + 2] = 0; d.data[i + 3] = 255
    } else {
      const g = Math.round((b.data[i] + b.data[i + 1] + b.data[i + 2]) / 3 * 0.3 + 178)
      d.data[i] = d.data[i + 1] = d.data[i + 2] = g; d.data[i + 3] = 255
    }
  }
}
const diffImage = path.join(dir(to), `${id}.vs-attempt-${String(from).padStart(2, '0')}.diff.png`)
fs.writeFileSync(diffImage, PNG.sync.write(d))
console.log(JSON.stringify({
  from, to, delta, changedPixels: changed,
  bbox: changed ? { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 } : null,
  diffImage: path.relative(bundle, diffImage),
}, null, 2))
