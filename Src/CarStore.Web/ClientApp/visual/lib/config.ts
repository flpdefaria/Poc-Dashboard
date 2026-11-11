import fs from 'node:fs'

/**
 * Preview dev server port. Deliberately NOT 5173: in Development the ASP.NET
 * app loads the SPA from the normal `npm run dev` server on 5173, which is
 * usually running. The harness always starts its own server with
 * `visual/vite.config.ts` on this port. `VISUAL_PORT` and `VISUAL_DEV_PORT`
 * are aliases.
 */
export const DEFAULT_DEV_PORT = 5175
export const DEV_PORT = Number(process.env.VISUAL_DEV_PORT ?? process.env.VISUAL_PORT) || DEFAULT_DEV_PORT

/** CarStore's Vite dev server is plain HTTP (no dev certificate). */
export const USES_HTTPS = false
export const BASE_URL = `http://localhost:${DEV_PORT}`
export const PREVIEW_PATH = '/visual/preview.html'

/**
 * Baseline (previous version) dev server. Enabled only when a launcher
 * (`run-compare.mjs`, or `run-scenario.mjs` with `VISUAL_BASELINE_REF`) has
 * prepared the worktree and exported `VISUAL_BASELINE_DIR`.
 */
export const BASELINE_PORT = 5174
export const BASELINE_URL = `http://localhost:${BASELINE_PORT}`

export function baselineDir(): string | null {
  const dir = process.env.VISUAL_BASELINE_DIR?.trim()
  return dir && fs.existsSync(dir) ? dir : null
}

export const BASELINE_ENABLED = baselineDir() !== null

/** Deterministic capture defaults. */
export const TIMEZONE_ID = 'UTC'
export const LOCALE_HINT = 'pt-BR'
export const DEFAULT_DEVICE_SCALE_FACTOR = 2
/**
 * Browser `Date` is pinned to this instant (Playwright `clock.setFixedTime`) so date-relative UI
 * (Home's 12-month "Novos clientes" chart, "há N dias" labels) is identical between runs and between
 * baseline and current. Timers and `performance.now()` keep running. Override per scenario with `now`.
 */
export const FIXED_NOW = '2026-11-10T12:00:00Z'

/** Everything under this prefix must be mocked or blocked — never live. */
export const API_BASE_PATH = '/api'

export function scenarioFilter(): string[] | null {
  const raw = process.env.VISUAL_SCENARIO?.trim()
  if (!raw) return null
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
