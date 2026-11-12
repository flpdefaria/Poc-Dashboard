#!/usr/bin/env node
/**
 * Crop the same box from two PNGs (e.g. Figma reference and capture) and place them side by side,
 * scaled up for glyph-level review.
 *
 *   npm run visual:crop -- <a.png> <b.png> <x> <y> <w> <h> [--scale 8] [--out crop.png]
 *
 * Coordinates are in image pixels. Default output: next to <b.png> as <name>.crop-x-y-w-h.png.
 * Prints the output path; open that small file instead of the full screenshots.
 */
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const args = process.argv.slice(2)
let scale = 8
let out = null
const pos = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scale') scale = Number(args[++i])
  else if (args[i] === '--out') out = args[++i]
  else pos.push(args[i])
}
if (pos.length !== 6 || !(scale > 0)) {
  console.error('Usage: npm run visual:crop -- <a.png> <b.png> <x> <y> <w> <h> [--scale 8] [--out crop.png]')
  process.exit(2)
}
const [aPath, bPath] = pos
const [x, y, w, h] = pos.slice(2).map(Number)
const read = (p) => PNG.sync.read(fs.readFileSync(p))
const imgs = [read(aPath), read(bPath)]
for (const [img, p] of [[imgs[0], aPath], [imgs[1], bPath]]) {
  if (x < 0 || y < 0 || x + w > img.width || y + h > img.height) {
    console.error(`[visual:crop] box ${x},${y} ${w}x${h} is outside ${p} (${img.width}x${img.height})`)
    process.exit(1)
  }
}
const gap = 10
const o = new PNG({ width: w * scale * 2 + gap, height: h * scale })
o.data.fill(255)
imgs.forEach((img, n) => {
  const off = n * (w * scale + gap)
  for (let j = 0; j < h * scale; j++) {
    for (let i = 0; i < w * scale; i++) {
      const si = ((y + Math.floor(j / scale)) * img.width + (x + Math.floor(i / scale))) * 4
      const di = (j * o.width + off + i) * 4
      for (let k = 0; k < 4; k++) o.data[di + k] = img.data[si + k]
    }
  }
})
const target = out ?? path.join(path.dirname(bPath), `${path.basename(bPath, '.png')}.crop-${x}-${y}-${w}-${h}.png`)
fs.writeFileSync(target, PNG.sync.write(o))
console.log(target)
