/**
 * Self-contained offline HTML for run bundles. No CDN, no fetch, no network.
 *
 * Plain ESM so both the Playwright teardown (TypeScript) and the
 * `write-verdict.mjs` CLI (plain Node) render the SAME page. Types live in
 * `report-render.d.mts`; the report shape in `report-types.ts`.
 */
import fs from 'node:fs'
import path from 'node:path'

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const REPORT_STYLES = `
:root{color-scheme:light dark;--bg:#ffffff;--fg:#18181b;--muted:#71717a;--line:#e4e4e7;--card:#fafafa;
--ok:#15803d;--diff:#b91c1c;--na:#a16207;--blocked:#7c2d12;--accent:#1d4ed8;--info:#1d4ed8}
@media (prefers-color-scheme:dark){:root{--bg:#0b0f19;--fg:#e5e7eb;--muted:#9ca3af;--line:#27272a;--card:#111827;
--ok:#4ade80;--diff:#f87171;--na:#fbbf24;--blocked:#fdba74;--accent:#93c5fd;--info:#93c5fd}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);
font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:32px 20px 80px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 10px}h3{font-size:15px;margin:20px 0 8px}
a{color:var(--accent)}
.sub{color:var(--muted);margin:0 0 20px}
.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;
border:1px solid currentColor}
.s-passed,.s-captured,.s-reused,.s-pass{color:var(--ok)}.s-differences,.s-fail{color:var(--diff)}
.s-not-applicable,.s-absent-at-base{color:var(--na)}
.s-partial{color:var(--na)}.s-blocked{color:var(--blocked)}.s-disabled,.s-unknown{color:var(--muted)}
.s-changed{color:var(--info)}.s-verified{color:var(--ok)}
.s-missing,.s-missing-element,.s-invalid,.s-unresolved{color:var(--na)}
.s-dimension-mismatch{color:var(--diff)}.s-partial-region,.s-dynamic,.s-data-driven,.s-info{color:var(--info)}
.card{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:18px;margin:16px 0}
.card>h2:first-child{margin-top:0}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
th{background:rgba(127,127,127,.09);font-weight:600}
.scroll{overflow-x:auto}
.imgs{display:flex;flex-wrap:wrap;gap:16px;margin-top:10px}
.imgs figure{margin:0;max-width:100%}
.imgs figcaption,.cols figcaption{color:var(--muted);font-size:12px;margin-bottom:6px}
.imgs img{max-width:520px;width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:#fff}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:10px}
.cols figure{margin:0;min-width:0}
.cols img{width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:#fff}
.wide img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:#fff}
.wide figure{margin:10px 0 0}
.thumb{max-width:220px;width:100%;height:auto;border:1px solid var(--line);border-radius:4px;background:#fff}
.info{border-left:3px solid var(--info);padding:6px 10px;margin:10px 0;background:rgba(29,78,216,.06)}
ul{margin:6px 0 0;padding-left:20px}
pre{background:rgba(127,127,127,.1);border:1px solid var(--line);border-radius:8px;padding:12px;
overflow-x:auto;font-size:12px;white-space:pre-wrap;word-break:break-word}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.missing{color:var(--na)}
.note{color:var(--muted);font-size:12px}
h1,h2,h3,.sub,li,p{overflow-wrap:anywhere}
.scroll{max-width:100%}
.pill{display:inline-block;padding:2px 9px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid var(--line);background:rgba(127,127,127,.1);color:var(--fg);vertical-align:middle}
.pill.p-light{background:#fef9c3;color:#713f12;border-color:#fde68a}
.pill.p-dark{background:#1e293b;color:#e2e8f0;border-color:#334155}
.pill.p-state{background:rgba(29,78,216,.1);color:var(--accent);border-color:var(--accent)}
.matrix{min-width:620px;table-layout:fixed}
.matrix th.rowh{width:96px;white-space:nowrap}
.matrix td:first-child,.matrix th:first-child{position:sticky;left:0;background:var(--bg);z-index:1}
.cell{display:block;margin:0 0 3px;font-size:12px;overflow-wrap:anywhere}
.cell b{font-weight:600}
.cell.empty{color:var(--muted)}
.cell-sep{border-top:1px dashed var(--line);margin:8px 0 0;padding-top:8px}
.grouphead{margin-top:36px}
.legend{margin:6px 0 12px}
.sec{border:1px solid var(--line);border-radius:8px;padding:12px;margin:12px 0}
.sec h4{margin:0 0 6px;font-size:14px;overflow-wrap:anywhere}
.sec .meta{color:var(--muted);font-size:12px;margin:0 0 8px;overflow-wrap:anywhere}
.sec .why{border-left:3px solid var(--na);padding:4px 10px;margin:6px 0;background:rgba(161,98,7,.07);font-size:13px}
.sec .cols{grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))}
.tabnav{display:flex;flex-wrap:wrap;gap:4px;margin:18px 0 0;padding:0;border-bottom:1px solid var(--line)}
.tabnav a{display:inline-block;padding:8px 14px;border:1px solid transparent;border-bottom:0;border-radius:8px 8px 0 0;
text-decoration:none;color:var(--fg);font-weight:500;margin-bottom:-1px}
.tabnav a:hover{background:rgba(127,127,127,.09)}
.tabnav a[aria-selected="true"]{background:var(--bg);border-color:var(--line);color:var(--accent);font-weight:700;
box-shadow:inset 0 3px 0 var(--accent)}
.tabnav a:focus-visible,.tabpanel:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.tabnav.sub{margin-top:10px}
.tabnav.sub a{padding:6px 12px;font-size:13px}
.tabnav .count{color:var(--muted);font-weight:400;font-size:12px}
.tabpanel{padding-top:6px}
.tabpanel[hidden]{display:none}
.panel-title{margin:28px 0 4px}
.js .panel-title{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,128px),1fr));gap:10px;margin:10px 0}
.stat{border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:var(--card)}
.stat b{display:block;font-size:20px;line-height:1.2}
.stat span{color:var(--muted);font-size:12px}
.cat{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid currentColor;white-space:nowrap}
.c-defeito{color:var(--diff)}.c-backend{color:var(--na)}.c-decisao-design{color:var(--info)}
.c-artefato-harness{color:var(--muted)}.c-intencional{color:var(--ok)}.c-conteudo-dinamico{color:var(--info)}
.c-nao-classificado{color:var(--blocked);border-style:dashed}
details.group{border:1px solid var(--line);border-radius:8px;margin:8px 0;background:var(--card)}
details.group>summary{cursor:pointer;padding:8px 12px;list-style-position:inside;overflow-wrap:anywhere}
details.group>summary .n{color:var(--muted);font-size:12px}
details.group>.scroll{padding:0 12px 12px}
details.more{margin:12px 0}
details.more>summary{cursor:pointer;font-weight:600}
td.num,th.num{text-align:right;white-space:nowrap}
.combo-head{margin-top:24px}
`

/** @param {number} n */
function attemptDirName(n) {
  return `attempt-${String(n).padStart(2, '0')}`
}

/**
 * Only relative paths and http(s) URLs become links; anything else (e.g.
 * `javascript:`) is rendered as text.
 *
 * @param {string} value
 */
function safeHref(value) {
  const v = String(value ?? '').trim()
  if (/^https?:\/\//i.test(v)) return v
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith('//')) return null
  return v.replace(/\\/g, '/')
}

/** @param {string} value */
function isImagePath(value) {
  return /\.(png|jpe?g|webp|gif)$/i.test(String(value ?? '').trim())
}

/**
 * Device class from the viewport width (CSS px): >= 1280 desktop, >= 768 tablet, otherwise mobile.
 *
 * @param {number} width
 * @returns {'desktop' | 'tablet' | 'mobile'}
 */
export function deviceFromWidth(width) {
  if (width >= 1280) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

const DEVICES = ['desktop', 'tablet', 'mobile']
/** @type {Record<string, string>} */
const DEVICE_LABEL = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Celular' }
const THEMES = ['light', 'dark']
/** @type {Record<string, string>} */
const THEME_LABEL = { light: 'Claro', dark: 'Escuro' }

/** @param {any} s */
function deviceOf(s) {
  return s.device ?? deviceFromWidth(s.viewport?.width ?? 0)
}
/** @param {any} s */
function deviceIsDerived(s) {
  return s.deviceDerived ?? s.device === undefined
}
/** @param {any} s */
function themeOf(s) {
  return s.theme === 'dark' ? 'dark' : 'light'
}
/** Scenarios with a `state` are not the screen with data. @param {any} s */
function isOtherState(s) {
  return Boolean(s.state)
}

/**
 * Figma node shown for a scenario: the scenario's `figmaNode`, else the source of its Figma spec.
 *
 * @param {any} s
 * @returns {{ nodeId: string, url: string | null, name: string | null } | null}
 */
function figmaNodeOf(s) {
  const n = s.figmaNode
  if (n?.nodeId) return { nodeId: n.nodeId, url: n.url ?? s.figmaSpec?.source?.url ?? null, name: n.name ?? null }
  const src = s.figmaSpec?.source
  if (src?.nodeId) return { nodeId: src.nodeId, url: src.url ?? null, name: src.nodeName ?? null }
  return null
}

/**
 * Device (desktop, tablet, mobile), then light before dark, then id.
 *
 * @param {any[]} list
 */
function sortScenarios(list) {
  return [...list].sort(
    (a, b) =>
      DEVICES.indexOf(deviceOf(a)) - DEVICES.indexOf(deviceOf(b)) ||
      THEMES.indexOf(themeOf(a)) - THEMES.indexOf(themeOf(b)) ||
      String(a.id).localeCompare(String(b.id)),
  )
}

/** @param {any} s */
function devicePills(s) {
  const dev = deviceOf(s)
  const th = themeOf(s)
  return `<span class="pill p-device">${escapeHtml(DEVICE_LABEL[dev])}${deviceIsDerived(s) ? ' (derivado)' : ''}</span> <span class="pill p-${th}">${escapeHtml(THEME_LABEL[th])}</span>${
    s.state ? ` <span class="pill p-state">${escapeHtml(s.state)}</span>` : ''
  }`
}

/** @param {{ nodeId: string, url: string | null, name: string | null } | null} node */
function figmaNodeHtml(node) {
  if (!node) return '<span class="note">sem frame do Figma</span>'
  const href = node.url ? safeHref(node.url) : null
  const id = `<code>${escapeHtml(node.nodeId)}</code>`
  return `${href ? `<a href="${escapeHtml(href)}">${id}</a>` : id}${node.name ? ` <span class="note">${escapeHtml(node.name)}</span>` : ''}`
}

/** Tab labels of the themes (the pills keep Claro / Escuro). @type {Record<string, string>} */
const THEME_TAB_LABEL = { light: 'Light', dark: 'Dark' }

/**
 * Anchor of the sub-tab that holds a scenario: `light-desktop`, `dark-mobile`, ... for the screen with
 * data; `outros-light` / `outros-dark` for the other states.
 *
 * @param {any} s
 */
function panelIdOf(s) {
  return isOtherState(s) ? `outros-${themeOf(s)}` : `${themeOf(s)}-${deviceOf(s)}`
}

/** @param {string} theme @param {string} device */
function comboLabel(theme, device) {
  return `${DEVICE_LABEL[device]} · ${THEME_TAB_LABEL[theme]}`
}

/**
 * Base URL of the Figma file of a scenario (without the query), from `figmaNode.url` or the spec source.
 *
 * @param {any} s
 */
function figmaFileBase(s) {
  const url = s.figmaNode?.url ?? s.figmaSpec?.source?.url
  if (url && /^https:\/\/(www\.)?figma\.com\//i.test(url)) return String(url).split('?')[0]
  const key = s.figmaSpec?.source?.fileKey
  return key ? `https://www.figma.com/design/${encodeURIComponent(key)}/` : null
}

/**
 * Link to a node. Instance sub-layers (`I1641:6964;804:725`) link to their instance root, which Figma can open.
 *
 * @param {any} s
 * @param {string} nodeId
 */
function figmaNodeUrl(s, nodeId) {
  const base = figmaFileBase(s)
  const root = String(nodeId ?? '').replace(/^I/, '').split(';')[0]
  if (!base || !/^\d+:\d+$/.test(root)) return null
  return `${base}?node-id=${root.replace(':', '-')}`
}

/** @param {any} s @param {string} nodeId @param {string | null | undefined} name */
function nodeLinkHtml(s, nodeId, name) {
  const href = figmaNodeUrl(s, nodeId)
  const id = `<code>${escapeHtml(nodeId)}</code>`
  return `${name ? `${escapeHtml(name)}<br />` : ''}${href ? `<a href="${escapeHtml(href)}">${id}</a>` : id}`
}

const CATEGORIES = ['defeito', 'backend', 'decisao-design', 'artefato-harness', 'intencional', 'conteudo-dinamico', 'nao-classificado']
/** @type {Record<string, string>} */
const CATEGORY_LABEL = {
  defeito: 'Defeito real',
  backend: 'Backend / regra de negócio',
  'decisao-design': 'Decisão de design',
  'artefato-harness': 'Artefato do harness',
  intencional: 'Intencional',
  'conteudo-dinamico': 'Conteúdo dinâmico',
  'nao-classificado': 'Não classificado',
}
/** @type {Record<string, string>} */
const CATEGORY_HINT = {
  defeito: 'volta para o dev',
  backend: 'dado ou regra que vem do backend',
  'decisao-design': 'desvio decidido ou inconsistência do próprio protótipo',
  'artefato-harness': 'efeito do preview mockado, não da view',
  intencional: 'divergência aceita e documentada',
  'conteudo-dinamico': 'depende do conteúdo (linhas, itens, valores do fixture)',
  'nao-classificado': 'sem explicação registrada no .figma.json',
}

/** @param {string} category */
function categoryChip(category) {
  return `<span class="cat c-${escapeHtml(category)}">${escapeHtml(CATEGORY_LABEL[category] ?? category)}</span>`
}

/**
 * Registry entry of `figmaSpec.explanations` for a spec row or a section. All keys given in the entry must
 * match; the entry with more keys wins. Nothing is invented here: no match means `null`.
 *
 * @param {any[] | undefined} list
 * @param {{ nodeId?: string, selector?: string, prop?: string, section?: string }} m
 */
function findExplanation(list, m) {
  /** @type {any} */
  let best = null
  let bestScore = 0
  for (const e of Array.isArray(list) ? list : []) {
    if (!e || typeof e !== 'object') continue
    let score = 0
    if (m.section !== undefined) {
      if (e.section !== m.section) continue
      score = 1
    } else {
      if (e.section !== undefined) continue
      const props = e.prop === undefined ? undefined : Array.isArray(e.prop) ? e.prop : [e.prop]
      const keys = [
        e.nodeId === undefined ? null : e.nodeId === m.nodeId,
        e.selector === undefined ? null : e.selector === m.selector,
        props === undefined ? null : props.includes(m.prop),
      ].filter((k) => k !== null)
      if (keys.includes(false)) continue
      score = keys.length
    }
    if (score > bestScore) {
      best = e
      bestScore = score
    }
  }
  return best
}

/**
 * Category and text of an item. Fallbacks use only what the spec/scenario recorded: a `dynamic` row's
 * `dynamicReason`, else "sem explicação registrada".
 *
 * @param {any} entry
 * @param {string | null | undefined} recordedReason
 */
function explanationOf(entry, recordedReason) {
  if (entry && CATEGORIES.includes(entry.category) && String(entry.text ?? '').trim()) {
    return { category: entry.category, text: String(entry.text), source: 'explanations' }
  }
  if (recordedReason) return { category: 'conteudo-dinamico', text: String(recordedReason), source: 'dynamicReason' }
  return { category: 'nao-classificado', text: 'sem explicação registrada', source: null }
}

/** @param {any} d */
function dims(d) {
  return d ? `${d.width}x${d.height}` : '—'
}

/**
 * Items of the "Resumo" list: spec rows that are fail / missing-element / dynamic, and sections whose outcome
 * is fail or blocked.
 *
 * @param {any} s
 */
export function scenarioItems(s) {
  const reg = s.figmaSpec?.explanations
  /** @type {any[]} */
  const items = []
  for (const r of s.specComparison?.results ?? []) {
    if (r.status === 'pass') continue
    const ex = explanationOf(
      findExplanation(reg, { nodeId: r.nodeId, selector: r.selector, prop: r.prop }),
      r.status === 'dynamic' ? r.dynamicReason : null,
    )
    items.push({
      kind: 'spec',
      status: r.status,
      nodeId: r.nodeId,
      nodeName: r.nodeName,
      selector: r.selector,
      prop: r.prop,
      figma: r.expected,
      actual: r.actual === null ? 'elemento não encontrado' : r.actual,
      ...ex,
    })
  }
  for (const sec of s.sections ?? []) {
    if (sec.outcome !== 'fail' && sec.outcome !== 'blocked') continue
    const ex = explanationOf(findExplanation(reg, { section: sec.id }), null)
    const diff = sec.comparison && sec.comparison.mismatchRatio != null ? ` · diff ${(sec.comparison.mismatchRatio * 100).toFixed(2)}%` : ''
    items.push({
      kind: 'section',
      status: sec.status,
      nodeId: sec.figmaNodeId,
      nodeName: `Seção: ${sec.label}`,
      selector: sec.captureSelector,
      prop: `pixels (${sec.heightMode})`,
      figma: dims(sec.figma),
      actual: `${dims(sec.actual)}${sec.region ? ` · ${sec.region.caption}` : ''}${diff}`,
      anchor: sectionAnchor(s, sec),
      ...ex,
    })
  }
  return items
}

/** @param {any} s @param {any} sec */
function sectionAnchor(s, sec) {
  return `${s.id}--${sec.id}`
}

/**
 * Counters of one scenario for the "Resumo" tab.
 *
 * @param {any} s
 */
function scenarioCounts(s) {
  const results = s.specComparison?.results ?? []
  const secs = s.sections ?? []
  const nodes = new Set(results.map((/** @type {any} */ r) => r.nodeId))
  for (const sec of secs) nodes.add(sec.figmaNodeId)
  const items = scenarioItems(s)
  /** @type {Record<string, number>} */
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const it of items) byCategory[it.category]++
  const by = (/** @type {string} */ st) => results.filter((/** @type {any} */ r) => r.status === st).length
  return {
    nodes: nodes.size,
    checks: results.length,
    pass: by('pass'),
    fail: by('fail'),
    missing: by('missing-element'),
    dynamic: by('dynamic'),
    secTotal: secs.length,
    secOk: secs.filter((/** @type {any} */ x) => x.outcome === 'ok').length,
    secFail: secs.filter((/** @type {any} */ x) => x.outcome === 'fail' || x.outcome === 'blocked').length,
    secDynamic: secs.filter((/** @type {any} */ x) => x.heightMode === 'dynamic' && x.heightStatus === 'dynamic').length,
    secDataDriven: secs.filter((/** @type {any} */ x) => x.status === 'data-driven').length,
    secPartialRegion: secs.filter((/** @type {any} */ x) => x.status === 'partial-region').length,
    items,
    byCategory,
  }
}

/** @param {ReturnType<typeof scenarioCounts>[]} list */
function addCounts(list) {
  /** @type {any} */
  const total = { nodes: 0, checks: 0, pass: 0, fail: 0, missing: 0, dynamic: 0, secTotal: 0, secOk: 0, secFail: 0, secDynamic: 0, secDataDriven: 0, secPartialRegion: 0, items: [], byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) }
  for (const c of list) {
    for (const k of ['nodes', 'checks', 'pass', 'fail', 'missing', 'dynamic', 'secTotal', 'secOk', 'secFail', 'secDynamic', 'secDataDriven', 'secPartialRegion']) total[k] += /** @type {any} */ (c)[k]
    total.items.push(...c.items)
    for (const cat of CATEGORIES) total.byCategory[cat] += c.byCategory[cat]
  }
  return total
}

/** @param {string} status */
function badge(status) {
  return `<span class="badge s-${escapeHtml(String(status).toLowerCase())}">${escapeHtml(status)}</span>`
}

/**
 * @param {string} caption
 * @param {string | null | undefined} rel
 * @param {string} [missingReason]
 */
function imageFigure(caption, rel, missingReason) {
  const href = rel ? safeHref(rel) : null
  if (!href) {
    return `<figure><figcaption>${escapeHtml(caption)}</figcaption><p class="missing">Not available — ${escapeHtml(
      missingReason ?? 'no reason recorded',
    )}</p></figure>`
  }
  return `<figure><figcaption>${escapeHtml(caption)}</figcaption><a href="${escapeHtml(
    href,
  )}"><img src="${escapeHtml(href)}" alt="${escapeHtml(caption)}" loading="lazy" /></a></figure>`
}

/** @param {any} c */
function mismatchText(c) {
  if (!c) return 'not compared'
  if (c.status === 'dimension-mismatch') {
    return `dimension mismatch (${c.reference.width}x${c.reference.height} vs ${c.actual.width}x${c.actual.height})`
  }
  return `${c.status} — ${c.mismatchedPixels} / ${c.comparedPixels} px (${((c.mismatchRatio ?? 0) * 100).toFixed(3)}%)`
}

/**
 * @param {any} c
 * @param {any} spec
 */
function specText(c, spec) {
  if (!spec) return 'no Figma spec'
  if (!c) return 'not checked'
  return `${c.status} — ${c.passed}/${c.total} pass, ${c.failed} fail, ${c.missing} missing${c.dynamic ? `, ${c.dynamic} dinâmicos (fora de pass/fail)` : ''}`
}

/** @param {string | null | undefined} status */
function baselineMissingReason(status, error) {
  switch (status) {
    case 'absent-at-base':
      return 'the component or preview does not exist at the base commit'
    case 'blocked':
      return `baseline capture failed${error ? ` — ${String(error).split('\n')[0]}` : ''}`
    case 'disabled':
    case undefined:
    case null:
      return 'no baseline requested for this run (use npm run visual:compare)'
    default:
      return 'baseline image missing'
  }
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows already-escaped cell HTML
 */
function table(headers, rows) {
  return `<div class="scroll"><table><thead><tr>${headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
}

/** @param {any} r */
function specKey(r) {
  return `${r.nodeId}|${r.selector}|${r.prop}`
}

/**
 * Counts for the matrix cell and the summary of a scenario with `sections`.
 *
 * @param {any} s
 */
function sectionSummary(s) {
  const list = s.sections ?? []
  return {
    total: list.length,
    ok: list.filter((/** @type {any} */ x) => x.outcome === 'ok').length,
    fail: list.filter((/** @type {any} */ x) => x.outcome === 'fail').length,
    blocked: list.filter((/** @type {any} */ x) => x.outcome === 'blocked').length,
    dynamic: list.filter((/** @type {any} */ x) => x.heightMode === 'dynamic' && x.heightStatus === 'dynamic').length,
    dataDriven: list.filter((/** @type {any} */ x) => x.status === 'data-driven').length,
  }
}

/** @param {any} s */
function sectionsLine(s) {
  if (!(s.sections ?? []).length) return null
  const c = sectionSummary(s)
  return `seções: ${c.ok} de ${c.total} ok · ${c.fail} falham · ${c.dynamic} dinâmicas (altura) · ${c.dataDriven} data-driven${c.blocked ? ` · ${c.blocked} bloqueadas` : ''}`
}

/** @param {any} s */
function matrixPixels(s) {
  if (s.wholeScreenInformational) return 'pixels: por seção (altura do frame dinâmica; tela inteira é informativa)'
  const c = s.comparison
  if (!c) return s.referenceImage ? 'pixels: não comparado' : 'pixels: sem imagem de referência'
  if (c.status === 'dimension-mismatch') {
    return `pixels: dimension-mismatch (Figma ${c.reference.width}x${c.reference.height} × atual ${c.actual.width}x${c.actual.height})`
  }
  return `pixels: ${c.status} · diff ${((c.mismatchRatio ?? 0) * 100).toFixed(2)}% (${c.mismatchedPixels}/${c.comparedPixels} px)`
}

/** @param {any} s */
function matrixCellEntry(s) {
  const spec = s.specComparison
  const specLine = spec
    ? `spec: ${spec.passed}/${spec.total} pass${spec.failed || spec.missing ? ` · ${spec.failed} fail · ${spec.missing} missing` : ''}${spec.dynamic ? ` · ${spec.dynamic} dinâmicos` : ''}`
    : s.figmaSpec
      ? 'spec: não checado'
      : s.figmaSpecError
        ? 'spec: inválido'
        : 'spec: sem spec Figma'
  const lines = [
    `<span class="cell"><a href="#${escapeHtml(panelIdOf(s))}"><b>${escapeHtml(s.id)}</b></a> ${badge(s.status)}</span>`,
    `<span class="cell">Figma: ${figmaNodeHtml(figmaNodeOf(s))}</span>`,
    `<span class="cell">${escapeHtml(specLine)}</span>`,
    `<span class="cell">${escapeHtml(matrixPixels(s))}</span>`,
  ]
  const secLine = sectionsLine(s)
  if (secLine) lines.push(`<span class="cell">${escapeHtml(secLine)}</span>`)
  if (typeof s.responsiveFindings === 'number') {
    lines.push(`<span class="cell">responsiveCheck: ${s.responsiveFindings} achado(s)</span>`)
  }
  if (!s.referenceImage && s.referenceNote) {
    lines.push(`<span class="cell note">Sem referência: ${escapeHtml(s.referenceNote)}</span>`)
  }
  return lines.join('\n')
}

/**
 * Matrix "Dispositivo × Tema": rows Desktop / Tablet / Celular, columns Claro / Escuro.
 * Only scenarios without a `state` fill it; the others are listed under "Outros estados".
 *
 * @param {any[]} scenarios
 */
function deviceThemeMatrix(scenarios) {
  const main = scenarios.filter((s) => !isOtherState(s))
  const rows = DEVICES.map((dev) => {
    const cells = THEMES.map((th) => {
      const list = sortScenarios(main.filter((s) => deviceOf(s) === dev && themeOf(s) === th))
      if (!list.length) {
        return `<td><span class="cell empty">Sem cenário — este run não tem cenário principal de ${escapeHtml(
          DEVICE_LABEL[dev],
        )} / ${escapeHtml(THEME_LABEL[th])}.</span></td>`
      }
      return `<td>${list.map((s, i) => `<div${i ? ' class="cell-sep"' : ''}>${matrixCellEntry(s)}</div>`).join('')}</td>`
    }).join('')
    return `<tr><th class="rowh" scope="row">${escapeHtml(DEVICE_LABEL[dev])}</th>${cells}</tr>`
  }).join('')
  const derived = main.some((s) => deviceIsDerived(s))
  const head = THEMES.map((th) => `<th scope="col">${escapeHtml(THEME_LABEL[th])}</th>`).join('')
  const derivedNote = derived
    ? ' Dispositivo marcado como (derivado) foi inferido da largura do viewport (&gt;=1280 desktop, &gt;=768 tablet, senão celular).'
    : ''
  return `<div class="scroll"><table class="matrix"><thead><tr><th class="rowh">Dispositivo</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
<p class="note legend">Cada célula: cenário (link para a sub-aba), frame do Figma (nodeId com link), status, spec pass/total, resultado de pixels e achados do responsiveCheck. O diff de pixels só existe quando as dimensões são iguais; <code>dimension-mismatch</code> lista Figma × atual.${derivedNote}</p>`
}

/**
 * Figma column of a scenario: reference image plus the node id (linked). The "Not available" text
 * only appears when there is really no reference image.
 *
 * @param {any} s
 */
function figmaFigure(s) {
  const node = figmaNodeOf(s)
  const href = s.referenceImage ? safeHref(s.referenceImage) : null
  const nodeLine = `<p class="note">Node: ${figmaNodeHtml(node)}</p>`
  if (!href) {
    const reason = s.referenceNote
      ? s.referenceNote
      : 'no reference image was supplied for this scenario (set `referenceNote` on the scenario to say why)'
    return `<figure><figcaption>Figma</figcaption><p class="missing">Not available — ${escapeHtml(reason)}</p>${node ? nodeLine : ''}</figure>`
  }
  return `<figure><figcaption>Figma</figcaption><a href="${escapeHtml(href)}"><img src="${escapeHtml(href)}" alt="Figma" loading="lazy" /></a>${nodeLine}</figure>`
}

/** @param {any} s */
function specSection(s) {
  const spec = s.figmaSpec
  if (!spec && !s.figmaSpecError) {
    return `<h3>Spec Figma ${badge('missing')}</h3><p class="missing">No <code>reference/${escapeHtml(
      s.id,
    )}.figma.json</code> — layout, typography, colors, tokens and texts were not checked.</p>`
  }
  if (!spec) return `<h3>Spec Figma ${badge('invalid')}</h3><pre>${escapeHtml(s.figmaSpecError)}</pre>`

  const src = spec.source ?? {}
  const href = src.url ? safeHref(src.url) : null
  const sourceRows = [
    ['Node', `<code>${escapeHtml(src.nodeId)}</code>${src.nodeName ? ` — ${escapeHtml(src.nodeName)}` : ''}`],
    ['File key', `<code>${escapeHtml(src.fileKey)}</code>`],
    ['URL', href ? `<a href="${escapeHtml(href)}">${escapeHtml(src.url)}</a>` : escapeHtml(src.url ?? '—')],
    ['Retrieved', escapeHtml(src.retrievedAt)],
    ['MCP tools', escapeHtml((src.tools ?? []).join(', '))],
    ['Frame', spec.frame ? escapeHtml(`${spec.frame.width}x${spec.frame.height}${spec.frame.exportScale ? ` @${spec.frame.exportScale}x export` : ''}`) : '—'],
  ]
  const sourceTable = `<div class="scroll"><table><tbody>${sourceRows
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${v}</td></tr>`)
    .join('')}</tbody></table></div>`

  const cmp = s.specComparison
  const prevByKey = new Map((s.baselineSpecComparison?.results ?? []).map((/** @type {any} */ r) => [specKey(r), r]))
  const checks = cmp
    ? `<p>${badge(cmp.status)} ${cmp.passed}/${cmp.total} pass · ${cmp.failed} fail · ${cmp.missing} missing element${cmp.dynamic ? ` · ${cmp.dynamic} dinâmicos (medidos e exibidos, fora de pass/fail)` : ''}</p>${table(
        ['Node', 'Selector', 'Property', 'Figma', 'Atual / Current', 'Anterior / Previous', 'Status', 'Explicação'],
        (cmp.results ?? []).map((/** @type {any} */ r) => {
          const prev = prevByKey.get(specKey(r))
          const ex =
            r.status === 'pass'
              ? null
              : explanationOf(
                  findExplanation(spec.explanations, { nodeId: r.nodeId, selector: r.selector, prop: r.prop }),
                  r.status === 'dynamic' ? r.dynamicReason : null,
                )
          return [
            `<code>${escapeHtml(r.nodeId)}</code>${r.nodeName ? `<br />${escapeHtml(r.nodeName)}` : ''}`,
            `<code>${escapeHtml(r.selector)}</code>`,
            `<code>${escapeHtml(r.prop)}</code>`,
            `<code>${escapeHtml(r.expected)}</code>`,
            r.actual === null ? '<span class="missing">element not found</span>' : `<code>${escapeHtml(r.actual)}</code>`,
            prev
              ? `${prev.actual === null ? '<span class="missing">not found</span>' : `<code>${escapeHtml(prev.actual)}</code>`} ${badge(prev.status)}`
              : '<span class="note">—</span>',
            r.status === 'dynamic'
              ? `${badge('dynamic')}<br /><span class="note">dif. <code>${escapeHtml(r.difference ?? 'n/d')}</code>${r.dynamicReason ? ` · ${escapeHtml(r.dynamicReason)}` : ''}</span>`
              : badge(r.status),
            ex ? `${categoryChip(ex.category)}<br />${escapeHtml(ex.text)}` : '<span class="note">—</span>',
          ]
        }),
      )}`
    : '<p class="note">Spec present but not checked (capture did not complete).</p>'

  const list = (/** @type {string} */ title, /** @type {any[]} */ items, /** @type {string[]} */ headers, /** @type {(x: any) => string[]} */ row) =>
    items?.length ? `<h3>${escapeHtml(title)}</h3>${table(headers, items.map(row))}` : ''
  const code = (/** @type {unknown} */ v) => (v === undefined || v === null || v === '' ? '<span class="note">—</span>' : `<code>${escapeHtml(v)}</code>`)

  return `<h3>Spec Figma ${cmp ? badge(cmp.status) : ''}</h3>
  ${sourceTable}
  ${checks}
  <details class="more"><summary>Tokens, textos, árvore de nós, Code Connect, PrimeVue e notas do spec</summary>
  ${list('Tokens (Figma variables)', spec.tokens, ['Token', 'Collection / mode', 'Value', 'CSS variable'], (t) => [
    code(t.name),
    escapeHtml([t.collection, t.mode].filter(Boolean).join(' / ') || '—'),
    code(t.value),
    t.cssVar ? code(t.cssVar) : '<span class="note">unverified</span>',
  ])}
  ${list('Texts', spec.texts, ['Node', 'Text'], (t) => [code(t.nodeId), escapeHtml(t.text)])}
  ${list('Node tree', spec.tree, ['Node', 'Name', 'Type', 'Component / variant', 'Bounds'], (n) => [
    code(n.id),
    escapeHtml(n.name),
    code(n.type),
    escapeHtml([n.componentName, n.variant ? Object.entries(n.variant).map(([k, v]) => `${k}=${v}`).join(', ') : ''].filter(Boolean).join(' · ') || '—'),
    n.bounds ? code(`${n.bounds.x},${n.bounds.y} ${n.bounds.width}x${n.bounds.height}`) : '—',
  ])}
  ${list('Code Connect', spec.codeConnect, ['Node', 'Component', 'Source'], (c) => [code(c.nodeId), code(c.component), code(c.source)])}
  ${list('PrimeVue mapping', spec.primevue, ['Node', 'Component', 'Status'], (p) => [code(p.nodeId), code(p.component), badge(p.status)])}
  ${spec.notes?.length ? `<h3>Design notes</h3><ul>${spec.notes.map((/** @type {string} */ n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : ''}
  </details>`
}

/** @param {any} s @param {any} sec */
function sectionExplanationHtml(s, sec) {
  if (sec.outcome !== 'fail' && sec.outcome !== 'blocked') return ''
  const ex = explanationOf(findExplanation(s.figmaSpec?.explanations, { section: sec.id }), null)
  return `${categoryChip(ex.category)} ${escapeHtml(ex.text)}`
}

/** @param {any} s @param {any} sec */
function sectionBlock(s, sec) {
  const c = sec.comparison
  const sizes =
    sec.figma && sec.actual
      ? `Figma ${sec.figma.width}x${sec.figma.height} · atual ${sec.actual.width}x${sec.actual.height}`
      : 'sem dimensões'
  const modeBits = [`heightMode: ${sec.heightMode}`, sec.dataDriven ? 'dataDriven' : ''].filter(Boolean).join(' · ')
  /** @type {string[]} */
  const why = []
  if (sec.heightInfo) why.push(sec.heightInfo)
  if (sec.sizeNote) why.push(sec.sizeNote)
  if (sec.region) {
    why.push(`Região comparada: ${sec.region.caption}. Recorte explícito, sem reescala; o diff abaixo cobre só essa faixa (partial-region).`)
  }
  if (sec.dataDriven && sec.reason) why.push(`data-driven — motivo: ${sec.reason}`)
  else if (sec.reason) why.push(`motivo: ${sec.reason}`)
  if (sec.figmaNote) why.push(`export Figma: ${sec.figmaNote}`)
  if (sec.maskSelectors?.length) why.push(`máscara extra na auditoria (dependem dos dados): ${sec.maskSelectors.join(', ')}`)
  const masked = sec.masked
    ? `<p class="note">${sec.dataDriven ? 'Auditoria data-driven' : 'Medição informativa (sem exceção declarada)'} (texto mascarado nas duas imagens, ${sec.masked.maskedBoxes} caixas, ${(sec.masked.maskedAreaRatio * 100).toFixed(1)}% da área): diff restante ${sec.masked.mismatchedPixels}/${sec.masked.comparedPixels} px (${(sec.masked.mismatchRatio * 100).toFixed(3)}%, tolerância ${(sec.masked.tolerance * 100).toFixed(1)}%) → ${sec.masked.passed ? 'o diff é texto/dado' : 'o diff NÃO é só dado'}.</p>`
    : ''
  const figImg = sec.region ? sec.region.figmaImage : sec.figmaImage
  const actImg = sec.region ? sec.region.actualImage : sec.actualImage
  const exHtml = sectionExplanationHtml(s, sec)
  return `<div class="sec" id="${escapeHtml(sectionAnchor(s, sec))}">
  <h4>${escapeHtml(sec.label)} ${badge(sec.status)} ${nodeLinkHtml(s, sec.figmaNodeId, null)}</h4>
  <p class="meta">${escapeHtml(modeBits)} · ${escapeHtml(sizes)} · seletor <code>${escapeHtml(sec.captureSelector)}</code></p>
  ${exHtml ? `<p class="why">Explicação: ${exHtml}</p>` : ''}
  ${why.map((w) => `<p class="why">${escapeHtml(w)}</p>`).join('')}
  <div class="cols">
    ${imageFigure(sec.region ? `Figma (${sec.region.caption})` : 'Figma', figImg, 'no reference image for this section')}
    ${imageFigure(sec.region ? 'Atual (mesma faixa)' : 'Atual', actImg, 'the section was not captured')}
    ${imageFigure('Diff', c?.diffImage, c ? 'no pixel diff exists (dimension mismatch)' : 'no comparison was run')}
  </div>
  ${masked}
  ${sec.masked?.diffImage ? `<div class="imgs">${imageFigure('Diff com texto mascarado', sec.masked.diffImage)}</div>` : ''}
</div>`
}

/** @param {any} s */
function sectionsSection(s) {
  const list = s.sections ?? []
  if (!list.length) return ''
  const rows = list.map((/** @type {any} */ sec) => [
    `<a href="#${escapeHtml(sectionAnchor(s, sec))}">${escapeHtml(sec.label)}</a>`,
    `<code>${escapeHtml(sec.heightMode)}${sec.dataDriven ? ' + dataDriven' : ''}</code>`,
    sec.figma && sec.actual
      ? `<code>${sec.figma.width}x${sec.figma.height}</code> × <code>${sec.actual.width}x${sec.actual.height}</code>`
      : '<span class="note">—</span>',
    sec.heightInfo ? escapeHtml(sec.heightInfo) : sec.heightStatus === 'match' ? 'altura igual' : '—',
    sec.region ? escapeHtml(sec.region.caption) : sec.comparison ? escapeHtml(mismatchText(sec.comparison)) : '—',
    badge(sec.status),
    sec.reason ? escapeHtml(sec.reason) : '<span class="note">—</span>',
    sectionExplanationHtml(s, sec) || '<span class="note">—</span>',
  ])
  return `<h3>Comparação por seção</h3>
  <p class="info"><strong>A altura do frame do Figma é dinâmica</strong> (linhas da tabela, itens dos rankings e insights dependem do conteúdo). Por isso a tela inteira não é comparada pixel a pixel: cada seção é comparada com o nó Figma da mesma seção (<code>fixed</code>: largura e altura exigidas; <code>dynamic</code>: largura exigida, altura informativa, diff só da faixa superior comum). Resumo: ${escapeHtml(sectionsLine(s) ?? '')}.</p>
  ${table(['Seção', 'Modo', 'Figma × atual', 'Altura', 'Pixels', 'Status', 'Motivo', 'Explicação'], rows)}
  ${list.map((/** @type {any} */ sec) => sectionBlock(s, sec)).join('')}`
}

/** @param {any} s */
function scenarioSection(s) {
  const c = s.comparison
  const baselineStatus = s.baselineStatus ?? 'disabled'
  /** @type {[string, string][]} */
  const rows = [
    ['Component', s.componentPath],
    ['Preview URL', s.previewUrl],
    ['Capture selector', s.captureSelector],
    ['Viewport', `${s.viewport.width}x${s.viewport.height} @${s.viewport.deviceScaleFactor}x`],
    ['Device', `${DEVICE_LABEL[deviceOf(s)]}${deviceIsDerived(s) ? ' (derived from viewport width)' : ''}`],
    ['Theme / locale', `${s.theme} / ${s.locale}`],
    ['Attempt', attemptDirName(s.attempt)],
    ['Algorithm', c ? `${c.algorithm} (threshold ${c.threshold})` : 'not run'],
    ['Reference dimensions', c ? `${c.reference.width}x${c.reference.height}` : 'no reference image'],
    ['Actual dimensions', c ? `${c.actual.width}x${c.actual.height}` : 'not compared'],
    [
      'Mismatched pixels',
      c && c.mismatchedPixels !== null
        ? `${c.mismatchedPixels} / ${c.comparedPixels} (${((c.mismatchRatio ?? 0) * 100).toFixed(3)}%)`
        : 'not computed',
    ],
    ['Baseline status', baselineStatus],
    ['Current vs previous', mismatchText(s.baselineComparison)],
    ['Previous vs Figma', mismatchText(s.baselineVsReference)],
    ['Figma spec (current)', specText(s.specComparison, s.figmaSpec)],
    ['Figma spec (previous)', specText(s.baselineSpecComparison, s.figmaSpec)],
  ]

  const findings = s.findings.length
    ? `<ul>${s.findings.map((/** @type {string} */ f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
    : '<p class="note">No findings.</p>'

  const missing = s.missingEvidence.length
    ? `<ul>${s.missingEvidence
        .map((/** @type {any} */ m) => `<li><code>${escapeHtml(m.item)}</code> — ${escapeHtml(m.reason)}</li>`)
        .join('')}</ul>`
    : '<p class="note">None.</p>'

  const blocked = s.blockedRequests.length
    ? `<div class="scroll"><table><thead><tr><th>Method</th><th>URL (credentials stripped)</th><th>Type</th><th>Reason</th></tr></thead><tbody>${s.blockedRequests
        .map(
          (/** @type {any} */ b) =>
            `<tr><td>${escapeHtml(b.method)}</td><td><code>${escapeHtml(b.url)}</code></td><td>${escapeHtml(
              b.resourceType,
            )}</td><td>${escapeHtml(b.reason)}</td></tr>`,
        )
        .join('')}</tbody></table></div>`
    : '<p class="note">No requests were blocked.</p>'

  const bc = s.baselineComparison
  const changeInfo =
    bc && bc.status !== 'passed'
      ? `<p class="info"><strong>Visual change vs base detected</strong> (${escapeHtml(
          mismatchText(bc),
        )}). Informational only — the run status reflects Figma parity.</p>`
      : bc
        ? '<p class="note">No visual change vs base (within tolerance).</p>'
        : ''

  const baselineBlock =
    baselineStatus === 'disabled' && !s.baselineImage
      ? ''
      : `<h3>Previous version (baseline) ${badge(baselineStatus)}</h3>
  ${changeInfo}
  <div class="imgs">
    ${imageFigure('Diff (previous → current)', bc?.diffImage, bc ? 'dimensions differed, so no pixel diff exists' : 'no baseline comparison was run')}
    ${imageFigure('Side by side (previous | current)', bc?.sideBySideImage, 'no baseline comparison was run')}
  </div>`

  return `
<section class="card" id="${escapeHtml(s.id)}">
  <h2>${devicePills(s)} ${escapeHtml(s.label)} ${badge(s.status)}</h2>
  <div class="scroll"><table><tbody>${rows
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td><code>${escapeHtml(v)}</code></td></tr>`)
    .join('')}</tbody></table></div>
  <h3>Anterior / Previous · Atual / Current · Figma</h3>
  <p class="note">The previous column is the base commit rendered by the same harness. It is never a Figma reference.</p>
  <div class="cols">
    ${imageFigure('Anterior / Previous', s.baselineImage, baselineMissingReason(baselineStatus, s.baselineError))}
    ${imageFigure('Atual / Current', s.actualImage, s.error ?? 'the capture did not complete')}
    ${figmaFigure(s)}
  </div>
  ${
    s.triptychImage
      ? `<div class="wide">${imageFigure('Triptych (previous | current | figma — missing panes omitted)', s.triptychImage)}</div>`
      : ''
  }
  ${sectionsSection(s)}
  <h3>${s.wholeScreenInformational ? 'Tela inteira × Figma (informativo; altura dinâmica, o status vem das seções)' : 'Figma comparison'}</h3>
  <div class="imgs">
    ${imageFigure('Diff', c?.diffImage, c ? 'dimensions differed, so no pixel diff exists' : 'no comparison was run')}
    ${imageFigure('Side by side (reference | actual)', c?.sideBySideImage, 'no comparison was run')}
  </div>
  ${specSection(s)}
  ${baselineBlock}
  <h3>Findings</h3>${findings}
  <h3>Missing evidence</h3>${missing}
  <h3>Blocked requests</h3>${blocked}
  ${s.baselineError ? `<h3>Baseline error</h3><pre>${escapeHtml(s.baselineError)}</pre>` : ''}
  ${s.error ? `<h3>Error</h3><pre>${escapeHtml(s.error)}</pre>` : ''}
</section>`
}

/** @param {string} e */
function evidenceItem(e) {
  const href = safeHref(e)
  if (href && isImagePath(e)) {
    return `<a href="${escapeHtml(href)}"><img class="thumb" src="${escapeHtml(href)}" alt="${escapeHtml(e)}" loading="lazy" /></a><br /><code>${escapeHtml(e)}</code>`
  }
  if (href && /^https?:\/\//i.test(href)) return `<a href="${escapeHtml(href)}">${escapeHtml(e)}</a>`
  return escapeHtml(e)
}

/** @param {any} verdict */
function verdictSection(verdict) {
  if (!verdict) return ''
  const criteria = (verdict.criteria ?? []).length
    ? `<div class="scroll"><table><thead><tr><th>#</th><th>Criterion</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${verdict.criteria
        .map(
          (/** @type {any} */ c, /** @type {number} */ i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(c.text)}</td><td>${badge(c.status)}</td><td>${
              (c.evidence ?? []).length
                ? `<ul>${c.evidence.map((/** @type {string} */ e) => `<li>${evidenceItem(e)}</li>`).join('')}</ul>`
                : '<span class="note">none</span>'
            }</td></tr>`,
        )
        .join('')}</tbody></table></div>`
    : '<p class="note">No criteria recorded.</p>'
  const notes = (verdict.notes ?? []).length
    ? `<h3>Notes</h3><ul>${verdict.notes.map((/** @type {string} */ n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : ''
  return `
<section class="card" id="verdict">
  <h2>Veredito QA / QA verdict ${badge(verdict.result)}</h2>
  ${verdict.recordedAt ? `<p class="note">Recorded ${escapeHtml(verdict.recordedAt)}</p>` : ''}
  ${criteria}
  ${notes}
</section>`
}

/** @param {any} b */
function baselineSummary(b) {
  if (!b || !b.enabled) {
    return '<p class="note">Baseline disabled for this run (use <code>npm run visual:compare</code>).</p>'
  }
  const changed = b.changedScenarios ?? []
  return `<div class="scroll"><table><tbody>
<tr><th>Ref</th><td><code>${escapeHtml(b.ref)}</code></td></tr>
<tr><th>Commit</th><td><code>${escapeHtml(b.commit)}</code></td></tr>
<tr><th>Dependencies</th><td><code>${escapeHtml(b.depsStrategy)}</code></td></tr>
<tr><th>Visual change vs base</th><td>${
    changed.length
      ? changed.map((/** @type {string} */ id) => `<a href="#${escapeHtml(id)}">${escapeHtml(id)}</a>`).join(', ')
      : 'none detected'
  }</td></tr>
</tbody></table></div>`
}

/**
 * Minimal inline script for the tabs (progressive enhancement). Without JavaScript the page shows every
 * panel in sequence and the tab bars are plain anchor links, so nothing is hidden. With it: WAI-ARIA tabs
 * (tablist / tab / tabpanel, aria-selected, roving tabindex, arrow keys, Home / End), deep links (#resumo,
 * #light-desktop, #<scenario-id>, #<scenario>--<section>) that open every enclosing tab, and in-page links
 * that switch tabs. No network, no storage.
 */
const TABS_SCRIPT = `(function(){
var d=document;d.documentElement.classList.add('js');
function each(l,f){Array.prototype.forEach.call(l,f)}
function tabsOf(g){var n=g.firstElementChild;return n?Array.prototype.slice.call(n.querySelectorAll('a[data-tab]')):[]}
function panelOf(t){return d.getElementById(t.getAttribute('href').slice(1))}
function select(g,t,focus){each(tabsOf(g),function(x){var on=x===t,p=panelOf(x);x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;if(p){if(on)p.removeAttribute('hidden');else p.setAttribute('hidden','')}});if(focus)t.focus()}
function setHash(id){if(history.replaceState)history.replaceState(null,'','#'+id)}
each(d.querySelectorAll('[data-tabs]'),function(g){var nav=g.firstElementChild,tabs=tabsOf(g);if(!tabs.length)return;nav.setAttribute('role','tablist');
each(tabs,function(t,i){var p=panelOf(t);t.setAttribute('role','tab');if(!t.id)t.id='tab-'+p.id;t.setAttribute('aria-controls',p.id);p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',t.id);p.tabIndex=0;
t.addEventListener('click',function(e){e.preventDefault();select(g,t,false);setHash(p.id)});
t.addEventListener('keydown',function(e){var j=i,k=e.key;if(k==='ArrowRight')j=(i+1)%tabs.length;else if(k==='ArrowLeft')j=(i-1+tabs.length)%tabs.length;else if(k==='Home')j=0;else if(k==='End')j=tabs.length-1;else return;e.preventDefault();select(g,tabs[j],true);setHash(panelOf(tabs[j]).id)})});
select(g,tabs[0],false)});
function reveal(id){var el=id&&d.getElementById(id);if(!el)return false;var chain=[];for(var n=el;n&&n!==d.body;n=n.parentElement){if(n.getAttribute('role')==='tabpanel')chain.unshift(n)}
each(chain,function(p){var t=d.getElementById(p.getAttribute('aria-labelledby'));var g=t&&t.closest('[data-tabs]');if(g)select(g,t,false)});
for(var m=el;m&&m!==d.body;m=m.parentElement){if(m.tagName==='DETAILS')m.open=true}
var target=el.getAttribute('role')==='tabpanel'?(el.closest('[data-tabs]')||el):el;target.scrollIntoView();return true}
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.hasAttribute('data-tab'))return;var id=decodeURIComponent(a.getAttribute('href').slice(1));if(reveal(id)){e.preventDefault();if(history.pushState)history.pushState(null,'','#'+id)}});
function fromHash(){reveal(decodeURIComponent(location.hash.slice(1)))}
window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);if(location.hash)fromHash();
})();`

/**
 * Tab bar + panels. Panels are siblings of the bar inside `[data-tabs]`; the bar must be the first child.
 *
 * @param {string} group
 * @param {string} label accessible name of the tab bar
 * @param {{ id: string, title: string, count?: number | null, body: string }[]} panels
 * @param {boolean} [sub]
 */
function tabsHtml(group, label, panels, sub = false) {
  const nav = `<nav class="tabnav${sub ? ' sub' : ''}" aria-label="${escapeHtml(label)}">${panels
    .map(
      (p) =>
        `<a href="#${escapeHtml(p.id)}" data-tab>${escapeHtml(p.title)}${
          typeof p.count === 'number' ? ` <span class="count">(${p.count})</span>` : ''
        }</a>`,
    )
    .join('')}</nav>`
  const body = panels
    .map(
      (p) =>
        `<section class="tabpanel" id="${escapeHtml(p.id)}">${sub ? `<h3 class="panel-title">${escapeHtml(p.title)}</h3>` : `<h2 class="panel-title">${escapeHtml(p.title)}</h2>`}${p.body}</section>`,
    )
    .join('\n')
  return `<div class="tabs" data-tabs="${escapeHtml(group)}">${nav}\n${body}</div>`
}

/** @param {string} label @param {number | string} value */
function stat(label, value) {
  return `<div class="stat"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`
}

/**
 * Items of one scenario grouped by explanation (category + text), most items first.
 *
 * @param {any} s
 * @param {any[]} items
 */
function itemGroupsHtml(s, items) {
  if (!items.length) return '<p class="note">Nenhum fail, missing-element ou dynamic.</p>'
  /** @type {Map<string, { category: string, text: string, source: string | null, items: any[] }>} */
  const groups = new Map()
  for (const it of items) {
    const key = `${it.category}\u0000${it.text}`
    if (!groups.has(key)) groups.set(key, { category: it.category, text: it.text, source: it.source, items: [] })
    groups.get(key)?.items.push(it)
  }
  const ordered = [...groups.values()].sort(
    (a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || b.items.length - a.items.length,
  )
  return ordered
    .map((g) => {
      const statuses = [...new Set(g.items.map((i) => i.status))].map((st) => badge(st)).join(' ')
      const rows = g.items.map((it) => [
        nodeLinkHtml(s, it.nodeId, it.nodeName),
        it.anchor
          ? `<a href="#${escapeHtml(it.anchor)}"><code>${escapeHtml(it.selector)}</code></a>`
          : `<code>${escapeHtml(it.selector)}</code>`,
        `<code>${escapeHtml(it.prop)}</code>`,
        `<code>${escapeHtml(it.figma)}</code>`,
        `<code>${escapeHtml(it.actual)}</code>`,
        badge(it.status),
      ])
      return `<details class="group"><summary>${categoryChip(g.category)} ${escapeHtml(g.text)} <span class="n">· ${g.items.length} ${
        g.items.length === 1 ? 'item' : 'itens'
      } ${statuses}${g.source === 'dynamicReason' ? ' · texto do dynamicReason do spec' : ''}</span></summary>${table(
        ['Nó (Figma)', 'Seletor', 'Propriedade', 'Figma', 'Atual', 'Status'],
        rows,
      )}</details>`
    })
    .join('\n')
}

/**
 * "Resumo" tab: totals, category counts, per-combination table, Figma frames, matrix, verdict and the
 * explained list of fail / missing-element / dynamic items.
 *
 * @param {any} report
 */
function summaryPanel(report) {
  const main = report.scenarios.filter((/** @type {any} */ s) => !isOtherState(s))
  const other = report.scenarios.filter(isOtherState)
  const combos = THEMES.flatMap((th) =>
    DEVICES.map((dev) => {
      const list = sortScenarios(main.filter((/** @type {any} */ s) => themeOf(s) === th && deviceOf(s) === dev))
      return { id: `${th}-${dev}`, theme: th, device: dev, list, counts: addCounts(list.map(scenarioCounts)) }
    }),
  )
  const total = addCounts(combos.map((c) => c.counts))
  const otherCounts = addCounts(other.map(scenarioCounts))

  const totals = `<div class="stats">
${stat('nodes do Figma verificados', total.nodes)}${stat('checagens do spec', total.checks)}${stat('pass', total.pass)}${stat('fail', total.fail)}${stat('missing-element', total.missing)}${stat('dynamic', total.dynamic)}${stat('seções ok / total', `${total.secOk} / ${total.secTotal}`)}${stat('seções com falha', total.secFail)}
</div>
<p class="note">Nodes = nodeIds únicos dos checks do spec mais os nós das seções, somados por combinação. Checagens = linhas do spec (inclui as dynamic, que ficam fora de pass/fail). Seções: ok, falha (fail ou bloqueada), dynamic (altura difere e é declarada dependente do conteúdo), data-driven e partial-region podem se sobrepor.</p>`

  const catRows = CATEGORIES.map((cat) => [
    `${categoryChip(cat)}<br /><span class="note">${escapeHtml(CATEGORY_HINT[cat])}</span>`,
    `<b>${total.byCategory[cat]}</b>`,
    ...combos.map((c) => String(c.counts.byCategory[cat] || '·')),
  ])
  const catTable = `<div class="scroll"><table><thead><tr><th>Categoria do motivo</th><th class="num">Total</th>${combos
    .map((c) => `<th class="num"><a href="#${escapeHtml(c.id)}">${escapeHtml(comboLabel(c.theme, c.device))}</a></th>`)
    .join('')}</tr></thead><tbody>${catRows
    .map((r) => `<tr>${r.map((v, i) => `<td${i ? ' class="num"' : ''}>${v}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>
<p class="note">Itens = linhas do spec fail / missing-element / dynamic + seções com falha. A explicação vem do registro <code>explanations</code> do <code>.figma.json</code> (ou do <code>dynamicReason</code> da linha dynamic); o relatório não inventa motivo.</p>`

  const comboRows = combos.map((c) => {
    const k = c.counts
    const scen = c.list.length
      ? c.list.map((/** @type {any} */ s) => `<a href="#${escapeHtml(s.id)}">${escapeHtml(s.id)}</a> ${badge(s.status)}`).join('<br />')
      : '<span class="note">sem cenário</span>'
    const frames = c.list.length ? c.list.map((/** @type {any} */ s) => figmaNodeHtml(figmaNodeOf(s))).join('<br />') : '—'
    return [
      `<a href="#${escapeHtml(c.id)}">${escapeHtml(comboLabel(c.theme, c.device))}</a>`,
      scen,
      frames,
      String(k.nodes),
      String(k.checks),
      String(k.pass),
      String(k.fail),
      String(k.missing),
      String(k.dynamic),
      k.secTotal ? `${k.secOk} ok · ${k.secFail} falha · ${k.secDynamic} dyn · ${k.secDataDriven} dd · ${k.secPartialRegion} pr (de ${k.secTotal})` : '—',
      CATEGORIES.filter((cat) => k.byCategory[cat]).map((cat) => `${categoryChip(cat)} ${k.byCategory[cat]}`).join(' ') || '—',
    ]
  })
  if (other.length) {
    const k = otherCounts
    comboRows.push([
      '<a href="#outros">Outros estados</a>',
      `${other.length} cenário(s)`,
      '—',
      String(k.nodes),
      String(k.checks),
      String(k.pass),
      String(k.fail),
      String(k.missing),
      String(k.dynamic),
      k.secTotal ? `${k.secOk} ok · ${k.secFail} falha (de ${k.secTotal})` : '—',
      CATEGORIES.filter((cat) => k.byCategory[cat]).map((cat) => `${categoryChip(cat)} ${k.byCategory[cat]}`).join(' ') || '—',
    ])
  }
  const comboTable = `<div class="scroll"><table><thead><tr><th>Tema × dispositivo</th><th>Cenário</th><th>Frame Figma</th><th class="num">Nodes</th><th class="num">Checagens</th><th class="num">pass</th><th class="num">fail</th><th class="num">missing</th><th class="num">dynamic</th><th>Seções</th><th>Itens por categoria</th></tr></thead><tbody>${comboRows
    .map((r) => `<tr>${r.map((v, i) => `<td${i >= 3 && i <= 8 ? ' class="num"' : ''}>${v}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>
<p class="note">Seções: dyn = dynamic (altura), dd = data-driven, pr = partial-region.</p>`

  const lists = combos
    .filter((c) => c.list.length)
    .map(
      (c) =>
        `<h3 class="combo-head" id="resumo-${escapeHtml(c.id)}"><a href="#${escapeHtml(c.id)}">${escapeHtml(comboLabel(c.theme, c.device))}</a> <span class="note">${c.counts.items.length} itens</span></h3>${c.list
          .map((/** @type {any} */ s) => `${c.list.length > 1 ? `<p class="note"><code>${escapeHtml(s.id)}</code></p>` : ''}${itemGroupsHtml(s, scenarioItems(s))}`)
          .join('')}`,
    )
    .join('\n')
  const unclassified = total.byCategory['nao-classificado'] + otherCounts.byCategory['nao-classificado']

  return `<p>${escapeHtml(main.length)} cenário(s) da tela com dados, ${escapeHtml(other.length)} em outros estados · run ${badge(report.runStatus)}${
    report.verdict ? ` · veredito QA ${badge(report.verdict.result)}` : ''
  }${unclassified ? ` · <span class="cat c-nao-classificado">${unclassified} sem explicação registrada</span>` : ''}</p>
<h3>Totais</h3>${totals}
<h3>Motivos por categoria</h3>${catTable}
<h3>Por combinação (tema × dispositivo)</h3>${comboTable}
<h3 id="matriz">Matriz Dispositivo × Tema</h3>${deviceThemeMatrix(report.scenarios)}
${verdictSection(report.verdict)}

<h3 id="itens">Fail, missing-element e dynamic, por combinação e motivo</h3>
<p class="note">Cada grupo junta os itens com a mesma explicação; abra para ver nó (link para o Figma), seletor, propriedade e Figma × atual. Seções com falha aparecem como "Seção: …" e o seletor leva à seção no cenário.</p>
${lists || '<p class="note">Nenhum cenário principal neste run.</p>'}`
}

/**
 * Counters shown in the "Resumo" tab, per theme × device combination of the main scenarios (for CLIs and
 * checks; the page uses the same functions).
 *
 * @param {any} report
 */
export function reportSummary(report) {
  const scenarios = (report.scenarios ?? []).map(normalizeScenario)
  const main = scenarios.filter((/** @type {any} */ s) => !isOtherState(s))
  const strip = (/** @type {any} */ c) => ({ ...c, items: c.items.length })
  const combos = THEMES.flatMap((th) =>
    DEVICES.map((dev) => {
      const list = main.filter((/** @type {any} */ s) => themeOf(s) === th && deviceOf(s) === dev)
      return { combo: `${th}-${dev}`, scenarios: list.map((/** @type {any} */ s) => s.id), ...strip(addCounts(list.map(scenarioCounts))) }
    }),
  )
  const unclassified = main.flatMap((/** @type {any} */ s) =>
    scenarioItems(s)
      .filter((it) => it.category === 'nao-classificado')
      .map((it) => ({ scenario: s.id, nodeId: it.nodeId, selector: it.selector, prop: it.prop, status: it.status })),
  )
  return { combos, total: strip(addCounts(main.map(scenarioCounts))), unclassified }
}

/** @param {any[]} list */
function scenarioListHtml(list) {
  return list.length
    ? list.map(scenarioSection).join('\n')
    : '<p class="note">Sem cenário desta combinação neste run.</p>'
}

/**
 * "Light" / "Dark" tab: sub-tabs Desktop, Tablet, Celular with the full scenario sections.
 *
 * @param {any[]} scenarios
 * @param {string} theme
 */
function themePanel(scenarios, theme) {
  const main = scenarios.filter((s) => !isOtherState(s) && themeOf(s) === theme)
  return tabsHtml(
    `${theme}-devices`,
    `Dispositivos — ${THEME_TAB_LABEL[theme]}`,
    DEVICES.map((dev) => {
      const list = sortScenarios(main.filter((s) => deviceOf(s) === dev))
      return { id: `${theme}-${dev}`, title: DEVICE_LABEL[dev], count: list.length, body: scenarioListHtml(list) }
    }),
    true,
  )
}

/** @param {any[]} scenarios */
function otherStatesPanel(scenarios) {
  const other = sortScenarios(scenarios.filter(isOtherState))
  if (!other.length) return '<p class="note">Nenhum cenário de outro estado neste run.</p>'
  const rows = other.map((s) => [
    `<a href="#${escapeHtml(s.id)}">${escapeHtml(s.id)}</a>`,
    devicePills(s),
    badge(s.status),
    typeof s.responsiveFindings === 'number' ? String(s.responsiveFindings) : '—',
    escapeHtml(s.referenceNote ?? '—'),
  ])
  return `<p class="note">Estados que não são a tela com dados (vazio, carregando, idioma, larguras intermediárias). Sem frame do Figma, a paridade é not-applicable; a captura é revisão do render.</p>
${table(['Cenário', 'Dispositivo · tema · estado', 'Status', 'responsiveCheck', 'Por que não há Figma'], rows)}
${tabsHtml(
  'outros-temas',
  'Outros estados por tema',
  THEMES.map((th) => {
    const list = other.filter((s) => themeOf(s) === th)
    return { id: `outros-${th}`, title: THEME_TAB_LABEL[th], count: list.length, body: scenarioListHtml(list) }
  }),
  true,
)}`
}

/**
 * Full run page: tabs Resumo, Light, Dark, Outros estados, Detalhes técnicos.
 *
 * @param {any} report
 * @param {string} runName
 */
export function runHtml(report, runName) {
  const raw = report
  report = { ...report, scenarios: (report.scenarios ?? []).map(normalizeScenario), attempts: report.attempts ?? [] }
  const ordered = [
    ...sortScenarios(report.scenarios.filter((/** @type {any} */ s) => !isOtherState(s))),
    ...sortScenarios(report.scenarios.filter(isOtherState)),
  ]
  const summary = `<div class="scroll"><table><thead><tr><th>Scenario</th><th>Device · theme</th><th>Status</th><th>Figma spec</th><th>Baseline</th><th>Component</th><th>Findings</th></tr></thead><tbody>${ordered
    .map(
      (/** @type {any} */ s) =>
        `<tr><td><a href="#${escapeHtml(s.id)}">${escapeHtml(s.id)}</a></td><td>${devicePills(s)}</td><td>${badge(s.status)}</td><td>${
          s.specComparison
            ? `${badge(s.specComparison.status)} <span class="note">${s.specComparison.passed}/${s.specComparison.total}</span>`
            : badge(s.figmaSpecError ? 'invalid' : 'missing')
        }</td><td>${badge(s.baselineStatus ?? 'disabled')}${
          s.baselineComparison && s.baselineComparison.status !== 'passed' ? ` ${badge('changed')}` : ''
        }</td><td><code>${escapeHtml(s.componentPath)}</code></td><td>${s.findings.length}</td></tr>`,
    )
    .join('')}</tbody></table></div>`

  const attempts = `<ul>${report.attempts
    .map(
      (/** @type {any} */ a) =>
        `<li><code>${escapeHtml(a.directory)}</code> — completed ${escapeHtml(a.completedAt)}, ${(a.scenarios ?? []).length} scenario(s)</li>`,
    )
    .join('')}</ul>`

  const details = `<h3>Cenários (todos)</h3>${summary}
<h3>Baseline (versão anterior)</h3>${baselineSummary(report.baseline)}
<h3>Attempts</h3>${attempts}
<details class="more"><summary>report.json (embutido)</summary>
<pre><code>${escapeHtml(JSON.stringify(raw, null, 2))}</code></pre>
</details>`

  const count = (/** @type {(s: any) => boolean} */ f) => report.scenarios.filter(f).length
  const tabs = tabsHtml('main', 'Seções do relatório', [
    { id: 'resumo', title: 'Resumo', body: summaryPanel(report) },
    { id: 'light', title: THEME_TAB_LABEL.light, count: count((s) => !isOtherState(s) && themeOf(s) === 'light'), body: themePanel(report.scenarios, 'light') },
    { id: 'dark', title: THEME_TAB_LABEL.dark, count: count((s) => !isOtherState(s) && themeOf(s) === 'dark'), body: themePanel(report.scenarios, 'dark') },
    { id: 'outros', title: 'Outros estados', count: count(isOtherState), body: otherStatesPanel(report.scenarios) },
    { id: 'detalhes', title: 'Detalhes técnicos', body: details },
  ])

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Visual check — ${escapeHtml(report.component)}</title>
<style>${REPORT_STYLES}</style></head>
<body><div class="wrap">
<h1>Visual check — ${escapeHtml(report.component)}</h1>
<p class="sub">Run <code>${escapeHtml(runName)}</code> · generated ${escapeHtml(report.generatedAt)} · run status ${badge(
    report.runStatus,
  )}${report.verdict ? ` · QA verdict ${badge(report.verdict.result)}` : ''}${report.schema ? ` · <code>${escapeHtml(report.schema)}</code>` : ''}</p>
<p><a href="findings.md">findings.md</a> · Decisão QA: ${badge(report.qaFindings?.status ?? 'BLOCKED')}</p>
<p class="note">Página 100% offline: estilos e script inline, imagens por caminho relativo, sem CDN e sem acesso à rede.</p>
<noscript><p class="note">JavaScript desligado: todas as abas aparecem em sequência; a barra de abas funciona como índice.</p></noscript>
${tabs}
</div>
<script>${TABS_SCRIPT}</script>
</body></html>
`
}

/**
 * Defaults for fields that older reports (schema 2/3/4) may lack, so they keep rendering.
 *
 * @param {any} s
 */
function normalizeScenario(s) {
  return {
    ...s,
    findings: s.findings ?? [],
    missingEvidence: s.missingEvidence ?? [],
    blockedRequests: s.blockedRequests ?? [],
    viewport: s.viewport ?? { width: 0, height: 0, deviceScaleFactor: 1 },
  }
}

/**
 * Regenerate `qa-results/index.html` from every run's
 * report.json, newest first.
 *
 * @param {string} artifactRoot
 */
export function rebuildRootIndex(artifactRoot) {
  const entries = fs
    .readdirSync(artifactRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(artifactRoot, d.name, 'report.json')))
    .map((d) => {
      /** @type {any} */
      let report
      try {
        report = JSON.parse(fs.readFileSync(path.join(artifactRoot, d.name, 'report.json'), 'utf8'))
      } catch {
        report = undefined
      }
      return {
        name: d.name,
        status: report?.runStatus ?? 'unknown',
        verdict: report?.verdict?.result ?? null,
        baseline: report?.baseline?.enabled ? String(report.baseline.commit ?? '').slice(0, 10) : null,
        component: report?.component ?? d.name,
        generatedAt: report?.generatedAt ?? '',
        scenarios: report?.scenarios?.length ?? 0,
      }
    })
    // Newest first: run directory names start with a sortable UTC stamp.
    .sort((a, b) => b.name.localeCompare(a.name))

  const rows = entries
    .map(
      (e) =>
        `<tr><td><a href="./${escapeHtml(e.name)}/index.html">${escapeHtml(e.name)}</a></td><td>${badge(
          e.status,
        )}</td><td>${e.verdict ? badge(e.verdict) : '<span class="note">—</span>'}</td><td>${
          e.baseline ? `<code>${escapeHtml(e.baseline)}</code>` : '<span class="note">—</span>'
        }</td><td><code>${escapeHtml(e.component)}</code></td><td>${e.scenarios}</td><td>${escapeHtml(
          e.generatedAt,
        )}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>CarStore frontend visual checks</title>
<style>${REPORT_STYLES}</style></head>
<body><div class="wrap">
<h1>CarStore frontend visual checks</h1>
<p class="sub">Newest run first. Every bundle is self-contained and opens offline.</p>
<div class="scroll"><table><thead><tr><th>Run</th><th>Status</th><th>QA verdict</th><th>Baseline</th><th>Component</th><th>Scenarios</th><th>Generated</th></tr></thead>
<tbody>${rows}</tbody></table></div>
</div></body></html>
`
  fs.writeFileSync(path.join(artifactRoot, 'index.html'), html, 'utf8')
}

/**
 * Write `<runDir>/index.html` for a report and refresh the root index.
 *
 * @param {string} runDir
 * @param {any} report
 * @param {string} artifactRoot
 */
export function writeRunPages(runDir, report, artifactRoot) {
  fs.writeFileSync(path.join(runDir, 'index.html'), runHtml(report, path.basename(runDir)), 'utf8')
  rebuildRootIndex(artifactRoot)
}
