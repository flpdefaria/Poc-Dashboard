/**
 * Self-contained offline HTML for a run bundle. No CDN, no fetch, no network.
 * The implementation lives in `report-render.mjs` so the plain-Node verdict
 * CLI renders the same page; this module keeps the original import path.
 */
export { REPORT_STYLES, deviceFromWidth, escapeHtml, rebuildRootIndex, reportSummary, runHtml, writeRunPages } from './report-render.mjs'
