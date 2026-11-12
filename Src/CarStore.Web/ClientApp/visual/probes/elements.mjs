/**
 * Default probe for `npm run visual:measure -- <ids> --sel <css> [--sel <css>…] [--props a,b]`.
 * For every selector (CSS, as in `.figma.json` checks) and every match: the box relative to the viewport,
 * the requested computed styles, the element's `class` attribute and, for an <svg>, the glyph bounds in
 * rendered px (path bbox scaled by the viewBox, centreline + stroke width) and the rendered stroke width.
 * Waits 600ms first so Aura colour transitions settle (see LEARNINGS.md).
 */
const DEFAULT_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderRadius',
  'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingLeft', 'gap', 'outlineStyle', 'outlineWidth', 'outlineColor', 'boxShadow']

export default async function elements(page) {
  const selectors = JSON.parse(process.env.VISUAL_MEASURE_SELECTORS || '[]')
  const props = (process.env.VISUAL_MEASURE_PROPS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!selectors.length) throw new Error('elements probe: pass at least one --sel <css selector>.')
  await page.waitForTimeout(600)
  return page.evaluate(({ selectors, props }) => {
    const round = (n) => Math.round(n * 1000) / 1000
    const out = {}
    for (const sel of selectors) {
      out[sel] = [...document.querySelectorAll(sel)].slice(0, 20).map((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const item = {
          box: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
          class: el.getAttribute('class'),
          focused: document.activeElement === el,
          focusVisible: el.matches(':focus-visible'),
          styles: Object.fromEntries(props.map((p) => [p, cs[p]])),
        }
        if (el instanceof SVGSVGElement && el.viewBox.baseVal && el.viewBox.baseVal.width) {
          const scale = r.width / el.viewBox.baseVal.width
          const shapes = [...el.querySelectorAll('path, line, polyline, polygon, circle, rect')]
          if (shapes.length) {
            const boxes = shapes.map((s) => s.getBBox())
            const x1 = Math.min(...boxes.map((b) => b.x)), y1 = Math.min(...boxes.map((b) => b.y))
            const x2 = Math.max(...boxes.map((b) => b.x + b.width)), y2 = Math.max(...boxes.map((b) => b.y + b.height))
            const sw = parseFloat(getComputedStyle(shapes[0]).strokeWidth) || 0
            item.glyph = {
              paths: shapes.length,
              centrelinePx: { x: round(x1 * scale), y: round(y1 * scale), w: round((x2 - x1) * scale), h: round((y2 - y1) * scale) },
              withStrokePx: { w: round((x2 - x1 + sw) * scale), h: round((y2 - y1 + sw) * scale) },
              renderedStrokePx: round(sw * scale),
            }
          }
        }
        return item
      })
    }
    return out
  }, { selectors, props: props.length ? props : DEFAULT_PROPS })
}
