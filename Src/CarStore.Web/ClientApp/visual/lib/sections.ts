import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

import type { VisualScenario, VisualSection } from '../types'
import {
  MISMATCH_RATIO_TOLERANCE,
  PIXELMATCH_THRESHOLD,
  compareImages,
  type ComparisonResult,
} from './compare'
import type { SectionResult } from './report-types'

/**
 * Per-section comparison (README "Seções e altura dinâmica"). Each section is captured from the same
 * page state as the scenario screenshot and compared with the Figma PNG of the matching CHILD node.
 * Images are never rescaled.
 */

/** Pad (CSS px) added around every text box before it is masked in the `dataDriven` audit. */
export const MASK_PADDING_PX = 3
/**
 * Allowed mismatch ratio of the masked audit. The audit only proves that what is left after hiding the
 * text boxes is the same pixels: antialiasing at the mask edges makes 0 unrealistic.
 */
export const MASKED_MISMATCH_TOLERANCE = 0.005

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SectionCapture {
  id: string
  /** Absolute path of the PNG written by the capture. */
  image: string
  /** Text/input boxes in CSS px, relative to the section's top-left corner. */
  textRects: Rect[]
  /** Section box in CSS px (not rounded). */
  box: Rect
}

export interface SectionCaptureFailure {
  id: string
  error: string
}

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/

/** Static validation of the scenario's `sections`; returns the problems found. */
export function validateSections(scenario: VisualScenario): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const s of scenario.sections ?? []) {
    if (!SAFE_ID.test(s.id)) problems.push(`section "${s.id}": id must be filename-safe (a-z, 0-9, "-")`)
    if (seen.has(s.id)) problems.push(`section "${s.id}": duplicated id`)
    seen.add(s.id)
    if (!s.captureSelector) problems.push(`section "${s.id}": captureSelector is required`)
    if (!s.figmaNodeId) problems.push(`section "${s.id}": figmaNodeId is required`)
    if (s.heightMode !== 'fixed' && s.heightMode !== 'dynamic') {
      problems.push(`section "${s.id}": heightMode must be 'fixed' or 'dynamic'`)
    }
    if (s.dataDriven && !s.reason?.trim()) {
      problems.push(`section "${s.id}": dataDriven requires a written reason (audit trail)`)
    }
  }
  return problems
}

/**
 * Screenshot of one section. A selector matching several elements captures their union bounding box
 * (page coordinates), which is how "title + KPI grid" becomes one Figma node.
 */
export async function captureSection(
  page: Page,
  section: VisualSection,
  outPath: string,
): Promise<SectionCapture> {
  const measured = await page.evaluate(
    ({ selector, pad, extra }) => {
      const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
      if (!els.length) return null
      const rects = els.map((e) => e.getBoundingClientRect())
      const left = Math.min(...rects.map((r) => r.left))
      const top = Math.min(...rects.map((r) => r.top))
      const right = Math.max(...rects.map((r) => r.right))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      const texts: { x: number; y: number; width: number; height: number }[] = []
      const push = (r: DOMRect) => {
        if (r.width <= 0 || r.height <= 0) return
        texts.push({ x: r.left - left - pad, y: r.top - top - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
      }
      for (const root of els) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        let node = walker.nextNode()
        while (node) {
          if ((node.textContent ?? '').trim()) {
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const r of Array.from(range.getClientRects())) push(r)
          }
          node = walker.nextNode()
        }
        for (const sel of extra) {
          for (const el of Array.from(root.querySelectorAll(sel))) push(el.getBoundingClientRect())
        }
        const inputs = root.matches('input,textarea') ? [root] : Array.from(root.querySelectorAll('input,textarea'))
        for (const input of inputs as HTMLInputElement[]) {
          if (input.value || input.placeholder) push(input.getBoundingClientRect())
        }
      }
      return {
        count: els.length,
        box: { x: left, y: top, width: right - left, height: bottom - top },
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        texts,
      }
    },
    { selector: section.captureSelector, pad: MASK_PADDING_PX, extra: section.maskSelectors ?? [] },
  )
  if (!measured) throw new Error(`captureSelector "${section.captureSelector}" matched no element`)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  if (measured.count === 1) {
    const el = page.locator(section.captureSelector).first()
    await el.screenshot({ path: outPath, animations: 'disabled', caret: 'hide', scale: 'device' })
  } else {
    await page.screenshot({
      path: outPath,
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
      clip: {
        x: measured.box.x + measured.scrollX,
        y: measured.box.y + measured.scrollY,
        width: measured.box.width,
        height: measured.box.height,
      },
    })
  }
  return { id: section.id, image: outPath, textRects: measured.texts, box: measured.box }
}

function readPng(file: string): PNG {
  return PNG.sync.read(fs.readFileSync(file))
}

function writePng(file: string, png: PNG): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, PNG.sync.write(png))
}

/** Top-left `width` x `height` pixels of `src`, copied (never scaled). */
function cropTopLeft(src: PNG, width: number, height: number): PNG {
  const out = new PNG({ width, height })
  PNG.bitblt(src, out, 0, 0, width, height, 0, 0)
  return out
}

function maskRects(png: PNG, rects: Rect[], scale: number): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x * scale))
    const y0 = Math.max(0, Math.floor(r.y * scale))
    const x1 = Math.min(png.width, Math.ceil((r.x + r.width) * scale))
    const y1 = Math.min(png.height, Math.ceil((r.y + r.height) * scale))
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * png.width + x) * 4
        png.data[i] = 255
        png.data[i + 1] = 0
        png.data[i + 2] = 255
        png.data[i + 3] = 255
      }
    }
  }
}

export interface MaskedDiff {
  mismatchedPixels: number
  comparedPixels: number
  mismatchRatio: number
  tolerance: number
  passed: boolean
  maskedBoxes: number
  /** Share of the compared area hidden by the mask. A mask that hides most of the section proves nothing. */
  maskedAreaRatio: number
}

/**
 * Diff of the same two images with every text/input box of the CURRENT render masked in BOTH images.
 * What is left is layout, color, icons, borders and shadows: if it still differs, the difference is
 * not just data.
 */
function maskedDiff(ref: PNG, act: PNG, rects: Rect[], scale: number, outPath: string): MaskedDiff {
  const a = new PNG({ width: ref.width, height: ref.height })
  const b = new PNG({ width: act.width, height: act.height })
  ref.data.copy(a.data)
  act.data.copy(b.data)
  maskRects(a, rects, scale)
  maskRects(b, rects, scale)
  const diff = new PNG({ width: ref.width, height: ref.height })
  const mismatchedPixels = pixelmatch(a.data, b.data, diff.data, ref.width, ref.height, {
    threshold: PIXELMATCH_THRESHOLD,
    includeAA: false,
  })
  writePng(outPath, diff)
  let masked = 0
  for (let i = 0; i < b.data.length; i += 4) {
    if (b.data[i] === 255 && b.data[i + 1] === 0 && b.data[i + 2] === 255) masked++
  }
  const comparedPixels = ref.width * ref.height
  const ratio = comparedPixels === 0 ? 0 : mismatchedPixels / comparedPixels
  return {
    mismatchedPixels,
    comparedPixels,
    mismatchRatio: ratio,
    tolerance: MASKED_MISMATCH_TOLERANCE,
    passed: ratio <= MASKED_MISMATCH_TOLERANCE,
    maskedBoxes: rects.length,
    maskedAreaRatio: comparedPixels === 0 ? 0 : masked / comparedPixels,
  }
}

const rel = (runDir: string, file: string | null) => (file ? path.relative(runDir, file) : null)

function relComparison(runDir: string, c: ComparisonResult): ComparisonResult {
  return { ...c, diffImage: rel(runDir, c.diffImage), sideBySideImage: rel(runDir, c.sideBySideImage) }
}

/**
 * Judge one section.
 *
 * - width differs: `dimension-mismatch` (always a finding, any mode);
 * - `fixed` and height differs: `dimension-mismatch`;
 * - `dynamic` and height differs: only the common top strip is compared (`partial-region`), saved as its own
 *   images with the explicit "compared top N px of M" caption; the height itself is information;
 * - `dataDriven`: a failing pixel diff is shown as information (`data-driven`) only if the masked audit
 *   proves it is text/data; otherwise the exception is rejected (`differences`).
 */
export function compareSection(opts: {
  section: VisualSection
  runDir: string
  referencePath: string
  capture: SectionCapture
  outDir: string
  basename: string
  deviceScaleFactor: number
}): SectionResult {
  const { section, runDir, referencePath, capture, outDir, basename, deviceScaleFactor } = opts
  const refPng = readPng(referencePath)
  const actPng = readPng(capture.image)
  const base = {
    id: section.id,
    label: section.label,
    captureSelector: section.captureSelector,
    figmaNodeId: section.figmaNodeId,
    heightMode: section.heightMode,
    dataDriven: !!section.dataDriven,
    ...(section.maskSelectors?.length ? { maskSelectors: section.maskSelectors } : {}),
    reason: section.reason ?? null,
    figmaNote: section.figmaNote ?? null,
    figmaImage: rel(runDir, referencePath),
    actualImage: rel(runDir, capture.image),
    figma: { width: refPng.width, height: refPng.height },
    actual: { width: actPng.width, height: actPng.height },
  }

  const scale = deviceScaleFactor || 1
  // Fractional DOM boxes (e.g. 640.4px, 800.5px) are rounded outward by the screenshot, while Figma exports
  // the node at its drawn size: a 1 device-px difference on a fractional axis is rounding, not a finding.
  const isFractional = (n: number) => Math.abs(n * scale - Math.round(n * scale)) > 0.01
  const widthTol = isFractional(capture.box.width) ? 1 : 0
  const heightTol = isFractional(capture.box.height) ? 1 : 0
  const widthOk = Math.abs(refPng.width - actPng.width) <= widthTol
  const heightOk = Math.abs(refPng.height - actPng.height) <= heightTol
  const dh = actPng.height - refPng.height
  const heightStatus: SectionResult['heightStatus'] = heightOk
    ? 'match'
    : section.heightMode === 'dynamic'
      ? 'dynamic'
      : 'mismatch'
  const heightInfo = heightOk
    ? null
    : section.heightMode === 'dynamic'
      ? `altura depende do conteúdo: Figma ${refPng.height}px, atual ${actPng.height}px (${dh >= 0 ? '+' : ''}${dh}px)`
      : `altura fixa difere: Figma ${refPng.height}px, atual ${actPng.height}px (${dh >= 0 ? '+' : ''}${dh}px)`
  const findings: string[] = []

  if (!widthOk || (!heightOk && section.heightMode === 'fixed')) {
    const comparison = compareImages(referencePath, capture.image, outDir, basename)
    findings.push(
      `Section "${section.label}": ${!widthOk ? 'width' : 'fixed height'} mismatch — Figma ${refPng.width}x${refPng.height}, ` +
        `current ${actPng.width}x${actPng.height}. Not rescaled.`,
    )
    return {
      ...base,
      status: 'dimension-mismatch',
      outcome: 'fail',
      heightStatus,
      heightInfo: heightInfo ?? null,
      widthOk,
      comparison: relComparison(runDir, comparison),
      region: null,
      masked: null,
      findings,
    }
  }

  // Same size, a 1px rounding difference (common area), or the common top strip of a dynamic section.
  let region: SectionResult['region'] = null
  let sizeNote: string | null = null
  let refUsed = refPng
  let actUsed = actPng
  let comparison: ComparisonResult
  if (heightOk && refPng.width === actPng.width && refPng.height === actPng.height) {
    comparison = compareImages(referencePath, capture.image, outDir, basename)
  } else if (heightOk) {
    const cw = Math.min(refPng.width, actPng.width)
    const ch = Math.min(refPng.height, actPng.height)
    refUsed = cropTopLeft(refPng, cw, ch)
    actUsed = cropTopLeft(actPng, cw, ch)
    const refCrop = path.join(outDir, `${basename}.common.figma.png`)
    const actCrop = path.join(outDir, `${basename}.common.actual.png`)
    writePng(refCrop, refUsed)
    writePng(actCrop, actUsed)
    comparison = compareImages(refCrop, actCrop, outDir, `${basename}.common`)
    sizeNote =
      `Figma ${refPng.width}x${refPng.height}, atual ${actPng.width}x${actPng.height} (caixa DOM ${Math.round(capture.box.width * 100) / 100}x${Math.round(capture.box.height * 100) / 100}): ` +
      `1px de arredondamento de caixa fracionária; comparada a área comum ${cw}x${ch}, sem reescala.`
  } else {
    const common = Math.min(refPng.height, actPng.height)
    const cw = Math.min(refPng.width, actPng.width)
    refUsed = cropTopLeft(refPng, cw, common)
    actUsed = cropTopLeft(actPng, cw, common)
    const refCrop = path.join(outDir, `${basename}.region.figma.png`)
    const actCrop = path.join(outDir, `${basename}.region.actual.png`)
    writePng(refCrop, refUsed)
    writePng(actCrop, actUsed)
    comparison = compareImages(refCrop, actCrop, outDir, `${basename}.region`)
    region = {
      comparedHeight: common,
      figmaHeight: refPng.height,
      actualHeight: actPng.height,
      caption: `compared top ${common} px of ${refPng.height} (Figma) / ${actPng.height} (atual)`,
      figmaImage: rel(runDir, refCrop),
      actualImage: rel(runDir, actCrop),
    }
  }

  const pixelsOk = comparison.status === 'passed'
  let masked: MaskedDiff | null = null
  if (!pixelsOk) {
    const rects = capture.textRects.filter((r) => r.y * scale < refUsed.height)
    masked = maskedDiff(
      refUsed,
      actUsed,
      rects,
      scale,
      path.join(outDir, `${basename}${region ? '.region' : ''}.masked-diff.png`),
    )
  }

  let status: SectionResult['status']
  let outcome: SectionResult['outcome']
  if (pixelsOk) {
    status = region ? 'partial-region' : 'passed'
    outcome = 'ok'
    if (section.dataDriven) {
      findings.push(`Section "${section.label}" is marked dataDriven but its pixels already match; the exception is not needed.`)
    }
  } else if (section.dataDriven) {
    if (masked && masked.passed) {
      status = 'data-driven'
      outcome = 'info'
      findings.push(
        `Section "${section.label}": pixel diff ${(comparison.mismatchRatio! * 100).toFixed(2)}% is data-driven ` +
          `(masked text diff ${(masked.mismatchRatio * 100).toFixed(3)}% <= ${(masked.tolerance * 100).toFixed(1)}%). Reason: ${section.reason}`,
      )
    } else {
      status = region ? 'partial-region' : 'differences'
      outcome = 'fail'
      findings.push(
        `Section "${section.label}" is marked dataDriven but the diff survives masking the text boxes ` +
          `(${((masked?.mismatchRatio ?? 0) * 100).toFixed(2)}% > ${(MASKED_MISMATCH_TOLERANCE * 100).toFixed(1)}%): ` +
          `the difference is not just data. The exception is rejected.`,
      )
    }
  } else {
    status = region ? 'partial-region' : 'differences'
    outcome = 'fail'
    findings.push(
      `Section "${section.label}"${region ? ` (${region.caption})` : ''}: ${comparison.findings.join(' ')}`,
    )
  }

  return {
    ...base,
    status,
    outcome,
    heightStatus,
    heightInfo,
    sizeNote,
    widthOk,
    comparison: relComparison(runDir, comparison),
    region,
    masked: masked
      ? { ...masked, diffImage: rel(runDir, path.join(outDir, `${basename}${region ? '.region' : ''}.masked-diff.png`)) }
      : null,
    findings,
  }
}

/** A section that could not be captured or has no reference PNG. */
export function blockedSection(
  section: VisualSection,
  runDir: string,
  reason: string,
  referencePath: string | null,
  capture: SectionCapture | null,
): SectionResult {
  return {
    id: section.id,
    label: section.label,
    captureSelector: section.captureSelector,
    figmaNodeId: section.figmaNodeId,
    heightMode: section.heightMode,
    dataDriven: !!section.dataDriven,
    reason: section.reason ?? null,
    figmaNote: section.figmaNote ?? null,
    figmaImage: referencePath && fs.existsSync(referencePath) ? rel(runDir, referencePath) : null,
    actualImage: capture ? rel(runDir, capture.image) : null,
    figma: null,
    actual: null,
    status: 'blocked',
    outcome: 'blocked',
    heightStatus: 'unknown',
    heightInfo: null,
    widthOk: null,
    comparison: null,
    region: null,
    masked: null,
    findings: [`Section "${section.label}" blocked: ${reason}`],
  }
}

export { MISMATCH_RATIO_TOLERANCE }
