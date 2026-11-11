import fs from 'node:fs'
import type { Page } from '@playwright/test'

import type { ExplanationCategory, FigmaCheck, FigmaCheckProp, FigmaSpec } from '../types'

const EXPLANATION_CATEGORIES: ExplanationCategory[] = [
  'defeito',
  'backend',
  'decisao-design',
  'artefato-harness',
  'intencional',
  'conteudo-dinamico',
]

export const DEFAULT_PX_TOLERANCE = 1
export const DEFAULT_COLOR_TOLERANCE = 2
const OPACITY_TOLERANCE = 0.01
const ALPHA_TOLERANCE = 0.02

/** `dynamic`: measured and shown, but the value follows the prototype's content; counts as neither pass nor fail. */
export type SpecCheckStatus = 'pass' | 'fail' | 'missing-element' | 'dynamic'

export interface SpecCheckResult {
  nodeId: string
  nodeName: string | null
  selector: string
  /** A FigmaCheckProp, or `frame.width` / `frame.height` / `text` / `text-present` / `token:<cssVar>`. */
  prop: string
  expected: string
  actual: string | null
  status: SpecCheckStatus
  /** Set on `dynamic` rows: actual − Figma for lengths (`+68.64px`), otherwise null. */
  difference?: string | null
  /** Set on `dynamic` rows: the spec's `dynamicReason`. */
  dynamicReason?: string
  /** Set on `dynamic` rows: whether the value would have passed the normal tolerance (information only). */
  wouldPass?: boolean
}

export interface SpecComparison {
  status: 'passed' | 'differences'
  /** pass + fail + missing-element rows; `dynamic` rows are NOT part of the total. */
  total: number
  passed: number
  failed: number
  missing: number
  /** Rows measured but excluded from pass/fail because they depend on the content. */
  dynamic: number
  results: SpecCheckResult[]
}

export type LoadedSpec = { spec: FigmaSpec; error: null } | { spec: null; error: string }

/** Minimal runtime validation; a malformed spec is reported, never silently skipped. */
export function loadSpec(file: string): LoadedSpec {
  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
  } catch (error) {
    return { spec: null, error: `invalid JSON — ${error instanceof Error ? error.message : String(error)}` }
  }
  const s = raw as Partial<FigmaSpec>
  const problems: string[] = []
  if (!s || typeof s !== 'object') problems.push('root is not an object')
  if (!s.source?.nodeId) problems.push('source.nodeId is required')
  if (!s.source?.fileKey) problems.push('source.fileKey is required')
  if (!s.source?.retrievedAt) problems.push('source.retrievedAt is required')
  if (!Array.isArray(s.checks)) problems.push('checks must be an array')
  else
    s.checks.forEach((c, i) => {
      if (!c?.nodeId) problems.push(`checks[${i}].nodeId is required`)
      if (!c?.selector) problems.push(`checks[${i}].selector is required`)
      if (!c?.props && c?.text === undefined && !c?.token)
        problems.push(`checks[${i}] asserts nothing (props, text or token)`)
      if (c?.dynamic && !c.dynamicReason?.trim())
        problems.push(`checks[${i}] is dynamic but has no dynamicReason`)
      if (c?.dynamic && c.props && Object.keys(c.props).some((p) => p !== 'height'))
        problems.push(`checks[${i}] is dynamic but asserts props other than height (${Object.keys(c.props).join(', ')}); colors, paddings, typography and widths are never dynamic`)
    })
  if (s.frame?.heightDynamic && !s.frame.heightDynamicReason?.trim())
    problems.push('frame.heightDynamic is set but frame.heightDynamicReason is missing')
  if (s.explanations !== undefined && !Array.isArray(s.explanations)) problems.push('explanations must be an array')
  else
    (s.explanations ?? []).forEach((e, i) => {
      if (!EXPLANATION_CATEGORIES.includes(e?.category))
        problems.push(`explanations[${i}].category must be one of ${EXPLANATION_CATEGORIES.join(', ')}`)
      if (!e?.text?.trim()) problems.push(`explanations[${i}].text is required`)
      const keyed = e?.nodeId !== undefined || e?.selector !== undefined || e?.prop !== undefined
      if (!keyed && !e?.section) problems.push(`explanations[${i}] matches nothing (nodeId, selector, prop or section)`)
      if (keyed && e?.section) problems.push(`explanations[${i}] mixes section with spec-row keys`)
    })
  return problems.length ? { spec: null, error: problems.join('; ') } : { spec: s as FigmaSpec, error: null }
}

interface ElementSnapshot {
  found: boolean
  width: number
  height: number
  style: Record<string, string>
  text: string
  vars: Record<string, string>
}

export interface ComputedSnapshot {
  root: { found: boolean; width: number; height: number; text: string }
  checks: ElementSnapshot[]
}

const STYLE_KEYS: Record<Exclude<FigmaCheckProp, 'width' | 'height'>, string> = {
  paddingTop: 'paddingTop',
  paddingRight: 'paddingRight',
  paddingBottom: 'paddingBottom',
  paddingLeft: 'paddingLeft',
  gap: 'gap',
  borderRadius: 'borderTopLeftRadius',
  borderWidth: 'borderTopWidth',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
  color: 'color',
  backgroundColor: 'backgroundColor',
  borderColor: 'borderTopColor',
  opacity: 'opacity',
  strokeWidth: 'strokeWidth',
}

/** Read bounding boxes, computed styles, text and custom properties for every check. */
export async function collectComputed(
  page: Page,
  captureSelector: string,
  spec: FigmaSpec,
): Promise<ComputedSnapshot> {
  const input = {
    captureSelector,
    styleKeys: Object.values(STYLE_KEYS),
    checks: spec.checks.map((c) => ({ selector: c.selector, cssVars: c.token ? [c.token.cssVar] : [] })),
  }
  return page.evaluate((arg) => {
    const collapse = (t: string) => t.replace(/\s+/g, ' ').trim()
    const root = document.querySelector(arg.captureSelector) as HTMLElement | null
    const rootRect = root?.getBoundingClientRect()
    return {
      root: {
        found: !!root,
        width: rootRect?.width ?? 0,
        height: rootRect?.height ?? 0,
        text: root ? collapse(root.innerText) : '',
      },
      checks: arg.checks.map((c) => {
        let el: HTMLElement | null = null
        if (root) {
          try {
            el = c.selector === ':scope' || root.matches(c.selector) ? root : (root.querySelector(c.selector) as HTMLElement | null)
          } catch {
            el = null
          }
        }
        if (!el) return { found: false, width: 0, height: 0, style: {}, text: '', vars: {} }
        const cs = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        const style: Record<string, string> = {}
        const toRgb = (v: string): string => {
          // Chromium serialises modern colour syntaxes (oklch(), lab(), color(srgb ...)) as-is;
          // normalise them to 8-bit sRGB through a canvas so they compare against Figma hex values.
          if (!/^(color|oklch|oklab|lab|lch)[(]/i.test(v)) return v
          try {
            const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
            if (!ctx) return v
            ctx.clearRect(0, 0, 1, 1)
            ctx.fillStyle = v
            ctx.fillRect(0, 0, 1, 1)
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
            return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 100) / 100})`
          } catch {
            return v
          }
        }
        for (const k of arg.styleKeys) style[k] = toRgb(String(cs[k as keyof CSSStyleDeclaration] ?? ''))
        const vars: Record<string, string> = {}
        for (const v of c.cssVars) vars[v] = cs.getPropertyValue(v).trim()
        return { found: true, width: rect.width, height: rect.height, style, text: collapse(el.innerText ?? el.textContent ?? ''), vars }
      }),
    }
  }, input)
}

type Rgba = [number, number, number, number]

/** Parses #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba() and `transparent`. */
export function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase()
  if (v === 'transparent') return [0, 0, 0, 0]
  const hex = /^#([0-9a-f]{3,8})$/.exec(v)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((ch) => ch + ch).join('')
    if (h.length !== 6 && h.length !== 8) return null
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(v)
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const ch = (p: string) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p))
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    return [ch(parts[0]), ch(parts[1]), ch(parts[2]), alpha]
  }
  return null
}

function parsePx(value: string | number): number | null {
  if (typeof value === 'number') return value
  const v = value.trim().toLowerCase()
  if (v === 'normal') return null
  const m = /^(-?\d*\.?\d+)(px)?$/.exec(v.split(' ')[0])
  return m ? parseFloat(m[1]) : null
}

function firstFamily(value: string): string {
  return value.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase()
}

function compareProp(
  prop: FigmaCheckProp,
  expected: number | string,
  actualRaw: string,
  check: FigmaCheck,
): boolean {
  const pxTol = check.tolerance?.px ?? DEFAULT_PX_TOLERANCE
  const colorTol = check.tolerance?.color ?? DEFAULT_COLOR_TOLERANCE
  switch (prop) {
    case 'color':
    case 'backgroundColor':
    case 'borderColor': {
      const e = parseColor(String(expected))
      const a = parseColor(actualRaw)
      if (!e || !a) return false
      return e.slice(0, 3).every((c, i) => Math.abs(c - a[i]) <= colorTol) && Math.abs(e[3] - a[3]) <= ALPHA_TOLERANCE
    }
    case 'fontFamily':
      return firstFamily(String(expected)) === firstFamily(actualRaw)
    case 'fontWeight':
      return Number(expected) === Number(actualRaw)
    case 'opacity':
      return Math.abs(Number(expected) - Number(actualRaw)) <= OPACITY_TOLERANCE
    case 'letterSpacing': {
      const e = parsePx(expected) ?? 0
      const a = parsePx(actualRaw) ?? 0
      return Math.abs(e - a) <= pxTol
    }
    case 'lineHeight': {
      const e = parsePx(expected)
      const a = parsePx(actualRaw)
      if (e === null || a === null) return String(expected).trim().toLowerCase() === actualRaw.trim().toLowerCase()
      return Math.abs(e - a) <= pxTol
    }
    default: {
      const e = parsePx(expected)
      const a = parsePx(actualRaw)
      return e !== null && a !== null && Math.abs(e - a) <= pxTol
    }
  }
}

/**
 * Border radius is clamped by the browser to half the shortest side, so pills (9999px / 50%)
 * and Figma radii >= half the side are the same shape. Percentages resolve against the box.
 */
function compareRadius(expected: number | string, actualRaw: string, w: number, h: number, check: FigmaCheck): boolean {
  const half = Math.min(w, h) / 2
  const resolve = (v: number | string): number | null => {
    if (typeof v === 'string' && v.trim().endsWith('%')) return (parseFloat(v) / 100) * Math.min(w, h)
    return parsePx(v)
  }
  const e = resolve(expected)
  const a = resolve(actualRaw)
  if (e === null || a === null) return false
  const tol = check.tolerance?.px ?? DEFAULT_PX_TOLERANCE
  return Math.abs(Math.min(e, half) - Math.min(a, half)) <= tol
}

const fmt = (n: number) => `${Math.round(n * 100) / 100}px`
const signed = (n: number) => `${n >= 0 ? '+' : '-'}${Math.abs(Math.round(n * 100) / 100)}px`

/** Compare a spec against a snapshot of the rendered DOM. */
export function compareSpec(spec: FigmaSpec, snapshot: ComputedSnapshot): SpecComparison {
  const results: SpecCheckResult[] = []
  const rootId = spec.source.nodeId

  if (spec.frame) {
    for (const dim of ['width', 'height'] as const) {
      const expected = spec.frame[dim]
      const actual = snapshot.root.found ? snapshot.root[dim] : null
      const dynamic = dim === 'height' && !!spec.frame.heightDynamic
      const ok = actual !== null && Math.abs(actual - expected) <= DEFAULT_PX_TOLERANCE
      results.push({
        nodeId: rootId,
        nodeName: spec.source.nodeName ?? null,
        selector: ':scope',
        prop: `frame.${dim}`,
        expected: fmt(expected),
        actual: actual === null ? null : fmt(actual),
        status: actual === null ? 'missing-element' : dynamic ? 'dynamic' : ok ? 'pass' : 'fail',
        ...(dynamic && actual !== null
          ? { difference: signed(actual - expected), dynamicReason: spec.frame.heightDynamicReason, wouldPass: ok }
          : {}),
      })
    }
  }

  spec.checks.forEach((check, i) => {
    const el = snapshot.checks[i]
    const base = { nodeId: check.nodeId, nodeName: check.nodeName ?? null, selector: check.selector }
    const push = (prop: string, expected: string, actual: string | null, ok: boolean) => {
      if (check.dynamic && el?.found) {
        const e = parsePx(expected)
        const a = actual === null ? null : parsePx(actual)
        results.push({
          ...base,
          prop,
          expected,
          actual,
          status: 'dynamic',
          difference: e !== null && a !== null ? signed(a - e) : null,
          dynamicReason: check.dynamicReason,
          wouldPass: ok,
        })
        return
      }
      results.push({ ...base, prop, expected, actual, status: !el?.found ? 'missing-element' : ok ? 'pass' : 'fail' })
    }

    for (const [prop, expected] of Object.entries(check.props ?? {}) as [FigmaCheckProp, number | string][]) {
      if (!el?.found) {
        push(prop, typeof expected === 'number' ? fmt(expected) : expected, null, false)
        continue
      }
      const actual =
        prop === 'width' || prop === 'height' ? fmt(el[prop]) : (el.style[STYLE_KEYS[prop]] ?? '')
      const unitless = prop === 'fontWeight' || prop === 'opacity'
      push(
        prop,
        typeof expected === 'number' && !unitless ? fmt(expected) : String(expected),
        actual,
        prop === 'borderRadius'
          ? compareRadius(expected, actual, el.width, el.height, check)
          : compareProp(prop, expected, actual, check),
      )
    }
    if (check.text !== undefined) {
      const expected = check.text.replace(/\s+/g, ' ').trim()
      push('text', expected, el?.found ? el.text : null, !!el?.found && el.text.includes(expected))
    }
    if (check.token) {
      const actual = el?.found ? (el.vars[check.token.cssVar] ?? '') : null
      const e = parseColor(check.token.expected)
      const a = actual ? parseColor(actual) : null
      const ok =
        actual !== null &&
        (e && a
          ? e.slice(0, 3).every((c, j) => Math.abs(c - a[j]) <= (check.tolerance?.color ?? DEFAULT_COLOR_TOLERANCE))
          : actual.toLowerCase() === check.token.expected.trim().toLowerCase())
      push(`token:${check.token.cssVar}`, `${check.token.name} = ${check.token.expected}`, actual, ok)
    }
  })

  for (const t of spec.texts ?? []) {
    const expected = t.text.replace(/\s+/g, ' ').trim()
    if (!expected) continue
    results.push({
      nodeId: t.nodeId,
      nodeName: null,
      selector: ':scope',
      prop: 'text-present',
      expected,
      actual: snapshot.root.found ? (snapshot.root.text.includes(expected) ? expected : 'not found in capture') : null,
      status: !snapshot.root.found ? 'missing-element' : snapshot.root.text.includes(expected) ? 'pass' : 'fail',
    })
  }

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const missing = results.filter((r) => r.status === 'missing-element').length
  const dynamic = results.filter((r) => r.status === 'dynamic').length
  return {
    status: failed || missing ? 'differences' : 'passed',
    total: passed + failed + missing,
    passed,
    failed,
    missing,
    dynamic,
    results,
  }
}
