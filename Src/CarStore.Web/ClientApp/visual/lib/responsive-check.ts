import type { Page } from '@playwright/test'

export interface ResponsiveOptions {
  /** Minimum interactive target size in CSS px (WCAG 2.5.5 / Apple HIG: 44). Default 44. */
  minTouchTarget?: number
}

export interface ResponsiveReport {
  viewportWidth: number
  documentScrollWidth: number
  /** `true` when the document scrolls horizontally (scrollWidth > viewport width + 1px). */
  horizontalOverflow: boolean
  /** Elements inside the capture root that extend past the viewport and are not clipped by a scroll/clip ancestor. */
  overflowingElements: { element: string; right: number; width: number }[]
  minTouchTarget: number
  /** Visible interactive elements smaller than `minTouchTarget` in either dimension. */
  smallTargets: { element: string; width: number; height: number; label: string }[]
  /** Leaf text elements clipped by overflow hidden/clip (scrollWidth > clientWidth). */
  clippedText: { element: string; clientWidth: number; scrollWidth: number; text: string }[]
  /** Text below WCAG AA (4.5:1, 3:1 for large text) and PrimeIcons below 3:1, against the first opaque background found upwards. */
  lowContrast: { element: string; text: string; ratio: number; required: number; color: string; background: string }[]
  /** All measured text/icon ratios, including passes, for targeted correction evidence. */
  contrastMeasurements?: { element: string; text: string; ratio: number; required: number; color: string; background: string }[]
}

/** Measures horizontal overflow, small touch targets and clipped text inside `captureSelector`. */
export async function collectResponsive(
  page: Page,
  captureSelector: string,
  options: ResponsiveOptions = {},
): Promise<ResponsiveReport> {
  const min = options.minTouchTarget ?? 44
  return page.evaluate(
    ({ selector, min }) => {
      const root = document.querySelector(selector) as HTMLElement | null
      const vw = document.documentElement.clientWidth
      const describe = (el: Element): string => {
        const parts: string[] = []
        let node: Element | null = el
        for (let i = 0; node && node !== document.body && i < 4; i++, node = node.parentElement) {
          const testId = node.getAttribute('data-testid')
          if (testId) {
            parts.unshift('[data-testid="' + testId + '"]')
            break
          }
          const cls = (node.getAttribute('class') ?? '')
            .split(/\s+/)
            .filter((c) => c && (!/^(p-|pi)/.test(c) || /^p-(tab|paginator|button|datepicker)/.test(c)))
            .slice(0, 2)
            .join('.')
          parts.unshift(node.tagName.toLowerCase() + (cls ? '.' + cls : ''))
        }
        return parts.join(' > ')
      }
      const visible = (el: Element): boolean => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
      }
      const clippedByAncestor = (el: Element): boolean => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a)
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && a.getBoundingClientRect().right <= vw + 1) return true
        }
        return false
      }
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      // Normalises any CSS colour (rgb, oklab, color-mix...) to [r, g, b, a].
      const rgba = (css: string): [number, number, number, number] => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = '#000'
        ctx.fillStyle = css
        ctx.fillRect(0, 0, 1, 1)
        const d = ctx.getImageData(0, 0, 1, 1).data
        return [d[0], d[1], d[2], d[3] / 255]
      }
      const over = (top: number[], bottom: number[]): number[] => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat([1])
      const backgroundOf = (el: Element): number[] => {
        const stack: number[][] = []
        for (let a: Element | null = el; a; a = a.parentElement) {
          const c = rgba(getComputedStyle(a).backgroundColor)
          if (c[3] > 0) stack.push(c)
          if (c[3] >= 1) break
        }
        let acc: number[] = stack.length && stack[stack.length - 1][3] >= 1 ? stack.pop()! : rgba(getComputedStyle(document.body).backgroundColor)
        if (acc[3] < 1) acc = [255, 255, 255, 1]
        while (stack.length) acc = over(stack.pop()!, acc)
        return acc
      }
      const lum = (c: number[]): number => {
        const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
      }
      const ratioOf = (fg: number[], bg: number[]): number => {
        const a = lum(fg), b = lum(bg)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      }
      const lowContrast: { element: string; text: string; ratio: number; required: number; color: string; background: string }[] = []
      const contrastMeasurements: NonNullable<ResponsiveReport['contrastMeasurements']> = []
      const overflowingElements: { element: string; right: number; width: number }[] = []
      const smallTargets: { element: string; width: number; height: number; label: string }[] = []
      const clippedText: { element: string; clientWidth: number; scrollWidth: number; text: string }[] = []
      if (root) {
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (!visible(el)) continue
          const r = el.getBoundingClientRect()
          if (r.right > vw + 1 && !clippedByAncestor(el) && overflowingElements.length < 15) {
            overflowingElements.push({ element: describe(el), right: Math.round(r.right), width: Math.round(r.width) })
          }
          const s = getComputedStyle(el)
          const text = (el.textContent ?? '').trim()
          if (
            /(hidden|clip)/.test(s.overflowX) &&
            el.scrollWidth > el.clientWidth + 1 &&
            el.children.length === 0 &&
            text &&
            clippedText.length < 15
          ) {
            clippedText.push({
              element: describe(el),
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              text: text.slice(0, 60),
            })
          }
        }
        const seen = new Set<string>()
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (!visible(el)) continue
          const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && (n.textContent ?? '').trim()).map((n) => (n.textContent ?? '').trim()).join(' ')
          const isIcon = el.tagName === 'I' && /(^|\s)pi(\s|-)/.test(el.getAttribute('class') ?? '')
          if (!own && !isIcon) continue
          const s = getComputedStyle(el)
          let fg: number[] = rgba(s.color)
          const bg = backgroundOf(el)
          if (fg[3] < 1) fg = over(fg, bg)
          const opacity = parseFloat(s.opacity)
          if (opacity < 1) fg = over([fg[0], fg[1], fg[2], opacity], bg)
          const size = parseFloat(s.fontSize)
          const large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight, 10) >= 700)
          const required = isIcon || large ? 3 : 4.5
          const ratio = Math.round(ratioOf(fg, bg) * 100) / 100
          const key = describe(el) + '|' + own + '|' + ratio
          contrastMeasurements.push({ element: describe(el), text: own || 'icon', ratio, required, color: s.color, background: 'rgb(' + bg.slice(0, 3).map(Math.round).join(',') + ')' })
          if (ratio < required && !seen.has(key) && lowContrast.length < 40) {
            seen.add(key)
            lowContrast.push({ element: describe(el), text: (own || 'icon').slice(0, 40), ratio, required, color: s.color, background: 'rgb(' + bg.slice(0, 3).map(Math.round).join(',') + ')' })
          }
        }
        const interactive = root.querySelectorAll(
          'a[href], button, input:not([type=hidden]), select, textarea, [role=tab], [role=button], [role=combobox], [tabindex]:not([tabindex="-1"])',
        )
        for (const el of Array.from(interactive)) {
          if (!visible(el)) continue
          const r = el.getBoundingClientRect()
          if ((r.width < min - 0.5 || r.height < min - 0.5) && smallTargets.length < 60) {
            smallTargets.push({
              element: describe(el),
              width: Math.round(r.width * 10) / 10,
              height: Math.round(r.height * 10) / 10,
              label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
            })
          }
        }
      }
      const scrollWidth = document.documentElement.scrollWidth
      return {
        viewportWidth: vw,
        documentScrollWidth: scrollWidth,
        horizontalOverflow: scrollWidth > vw + 1,
        overflowingElements,
        minTouchTarget: min,
        smallTargets,
        clippedText,
        lowContrast,
        contrastMeasurements,
      }
    },
    { selector: captureSelector, min },
  )
}

/** One-line findings for the scenario report. */
export function responsiveFindings(r: ResponsiveReport): string[] {
  const out: string[] = []
  if (r.horizontalOverflow) {
    const first = r.overflowingElements[0]
    out.push(
      `Responsive: horizontal overflow, document scrollWidth ${r.documentScrollWidth}px > viewport ${r.viewportWidth}px` +
        (first ? ` (first offender ${first.element}, right edge ${first.right}px).` : '.'),
    )
  }
  if (r.smallTargets.length) {
    out.push(`Responsive: ${r.smallTargets.length} interactive element(s) smaller than ${r.minTouchTarget}x${r.minTouchTarget}px.`)
  }
  if (r.clippedText.length) {
    out.push(`Responsive: ${r.clippedText.length} text element(s) clipped by overflow.`)
  }
  if (r.lowContrast.length) {
    out.push(`Responsive: ${r.lowContrast.length} text/icon element(s) below WCAG contrast (4.5:1 text, 3:1 large text and icons).`)
  }
  return out
}
