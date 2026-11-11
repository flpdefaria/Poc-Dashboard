import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

/** pixelmatch per-pixel colour-distance threshold (0 = strictest). */
export const PIXELMATCH_THRESHOLD = 0.1
/** Fraction of differing pixels tolerated before a scenario is a finding. */
export const MISMATCH_RATIO_TOLERANCE = 0.001

export interface Dimensions {
  width: number
  height: number
}

export interface ComparisonResult {
  status: 'passed' | 'differences' | 'dimension-mismatch'
  algorithm: 'pixelmatch'
  threshold: number
  mismatchTolerance: number
  reference: Dimensions
  actual: Dimensions
  mismatchedPixels: number | null
  comparedPixels: number | null
  mismatchRatio: number | null
  diffImage: string | null
  sideBySideImage: string | null
  findings: string[]
}

function readPng(file: string): PNG {
  return PNG.sync.read(fs.readFileSync(file))
}

function writePng(file: string, png: PNG): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, PNG.sync.write(png))
}

/** Blit `src` into `dst` at (`dx`,`dy`). */
function blit(dst: PNG, src: PNG, dx: number, dy: number): void {
  PNG.bitblt(src, dst, 0, 0, src.width, src.height, dx, dy)
}

function fill(png: PNG, r: number, g: number, b: number): void {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r
    png.data[i + 1] = g
    png.data[i + 2] = b
    png.data[i + 3] = 255
  }
}

/**
 * Compare an actual screenshot against a reference image.
 *
 * Images are NEVER rescaled: differing dimensions are reported as a finding,
 * because a resize would manufacture a match that the browser never produced.
 */
export function compareImages(
  referencePath: string,
  actualPath: string,
  outDir: string,
  basename: string,
): ComparisonResult {
  const reference = readPng(referencePath)
  const actual = readPng(actualPath)

  const refDims: Dimensions = { width: reference.width, height: reference.height }
  const actDims: Dimensions = { width: actual.width, height: actual.height }

  const sideBySidePath = path.join(outDir, `${basename}.side-by-side.png`)
  writeSideBySide(reference, actual, sideBySidePath)

  if (refDims.width !== actDims.width || refDims.height !== actDims.height) {
    return {
      status: 'dimension-mismatch',
      algorithm: 'pixelmatch',
      threshold: PIXELMATCH_THRESHOLD,
      mismatchTolerance: MISMATCH_RATIO_TOLERANCE,
      reference: refDims,
      actual: actDims,
      mismatchedPixels: null,
      comparedPixels: null,
      mismatchRatio: null,
      diffImage: null,
      sideBySideImage: sideBySidePath,
      findings: [
        `Dimension mismatch: reference is ${refDims.width}x${refDims.height}, actual is ` +
          `${actDims.width}x${actDims.height}. No pixel diff was produced — the images were ` +
          `not rescaled, because rescaling would hide the very difference being measured.`,
      ],
    }
  }

  const diff = new PNG({ width: refDims.width, height: refDims.height })
  const mismatchedPixels = pixelmatch(
    reference.data,
    actual.data,
    diff.data,
    refDims.width,
    refDims.height,
    { threshold: PIXELMATCH_THRESHOLD, includeAA: false },
  )
  const diffPath = path.join(outDir, `${basename}.diff.png`)
  writePng(diffPath, diff)

  const comparedPixels = refDims.width * refDims.height
  const mismatchRatio = comparedPixels === 0 ? 0 : mismatchedPixels / comparedPixels
  const passed = mismatchRatio <= MISMATCH_RATIO_TOLERANCE

  return {
    status: passed ? 'passed' : 'differences',
    algorithm: 'pixelmatch',
    threshold: PIXELMATCH_THRESHOLD,
    mismatchTolerance: MISMATCH_RATIO_TOLERANCE,
    reference: refDims,
    actual: actDims,
    mismatchedPixels,
    comparedPixels,
    mismatchRatio,
    diffImage: diffPath,
    sideBySideImage: sideBySidePath,
    findings: passed
      ? []
      : [
          `${mismatchedPixels} of ${comparedPixels} pixels differ ` +
            `(${(mismatchRatio * 100).toFixed(3)}%), above the ` +
            `${(MISMATCH_RATIO_TOLERANCE * 100).toFixed(3)}% tolerance ` +
            `at pixelmatch threshold ${PIXELMATCH_THRESHOLD}.`,
        ],
  }
}

/**
 * previous | current | figma, laid out horizontally with gutters and
 * top-aligned. Missing panes are OMITTED (never drawn as a placeholder that
 * could be mistaken for a screenshot). Never rescaled.
 *
 * Returns the list of panes actually written, in order.
 */
export function writeTriptych(
  baselinePath: string | null,
  currentPath: string,
  referencePath: string | null,
  outPath: string,
): ('previous' | 'current' | 'figma')[] {
  const panes: { name: 'previous' | 'current' | 'figma'; png: PNG }[] = []
  if (baselinePath && fs.existsSync(baselinePath)) panes.push({ name: 'previous', png: readPng(baselinePath) })
  panes.push({ name: 'current', png: readPng(currentPath) })
  if (referencePath && fs.existsSync(referencePath)) panes.push({ name: 'figma', png: readPng(referencePath) })

  const gutter = 24
  const width = panes.reduce((sum, p) => sum + p.png.width, 0) + gutter * (panes.length - 1)
  const height = Math.max(...panes.map((p) => p.png.height))
  const canvas = new PNG({ width, height })
  fill(canvas, 244, 244, 245)
  let x = 0
  for (const pane of panes) {
    blit(canvas, pane.png, x, 0)
    x += pane.png.width + gutter
  }
  writePng(outPath, canvas)
  return panes.map((p) => p.name)
}

/** Reference | actual, laid out horizontally with a gutter. Never rescaled. */
function writeSideBySide(reference: PNG, actual: PNG, outPath: string): void {
  const gutter = 16
  const width = reference.width + gutter + actual.width
  const height = Math.max(reference.height, actual.height)
  const canvas = new PNG({ width, height })
  fill(canvas, 244, 244, 245)
  blit(canvas, reference, 0, 0)
  blit(canvas, actual, reference.width + gutter, 0)
  writePng(outPath, canvas)
}
