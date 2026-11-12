import fs from 'node:fs'
import {
  API_BASE_PATH as PROJECT_API_BASE_PATH,
  BASELINE_PORT as PROJECT_BASELINE_PORT,
  DEFAULT_PREVIEW_PORT,
  FIXED_NOW as PROJECT_FIXED_NOW,
  LOCALE_HINT as PROJECT_LOCALE,
  TIMEZONE_ID as PROJECT_TIMEZONE,
  USES_HTTPS as PROJECT_HTTPS,
} from './project.mjs'

/**
 * Every value here comes from `visual/project.json` (see `lib/project.mjs`).
 * Edit that file, not this one.
 */

/**
 * Preview dev server port. Deliberately NOT the app's normal `npm run dev`
 * port (usually 5173), which is often running for local development. The
 * harness always starts its own server with `visual/vite.config.ts` on this
 * port. `VISUAL_PORT` and `VISUAL_DEV_PORT` are aliases.
 */
export const DEFAULT_DEV_PORT = DEFAULT_PREVIEW_PORT
export const DEV_PORT = Number(process.env.VISUAL_DEV_PORT ?? process.env.VISUAL_PORT) || DEFAULT_DEV_PORT

/** `devServerHttps` in project.json: whether the Vite dev server uses a dev certificate. */
export const USES_HTTPS = PROJECT_HTTPS
const SCHEME = USES_HTTPS ? 'https' : 'http'
export const BASE_URL = `${SCHEME}://localhost:${DEV_PORT}`
export const PREVIEW_PATH = '/visual/preview.html'

/**
 * Baseline (previous version) dev server. Enabled only when a launcher
 * (`run-compare.mjs`, or `run-scenario.mjs` with `VISUAL_BASELINE_REF`) has
 * prepared the worktree and exported `VISUAL_BASELINE_DIR`.
 */
export const BASELINE_PORT = PROJECT_BASELINE_PORT
export const BASELINE_URL = `${SCHEME}://localhost:${BASELINE_PORT}`

export function baselineDir(): string | null {
  const dir = process.env.VISUAL_BASELINE_DIR?.trim()
  return dir && fs.existsSync(dir) ? dir : null
}

export const BASELINE_ENABLED = baselineDir() !== null

/** Deterministic capture defaults. */
export const TIMEZONE_ID = PROJECT_TIMEZONE
export const LOCALE_HINT = PROJECT_LOCALE
export const DEFAULT_DEVICE_SCALE_FACTOR = 2
/**
 * Browser `Date` is pinned to this instant (Playwright `clock.setFixedTime`) so
 * date-relative UI ("last 12 months" charts, "N days ago" labels) is identical
 * between runs and between baseline and current. Timers and `performance.now()`
 * keep running. Override per scenario with `now`.
 */
export const FIXED_NOW = PROJECT_FIXED_NOW

/** Everything under this prefix must be mocked or blocked — never live. */
export const API_BASE_PATH = PROJECT_API_BASE_PATH

export function scenarioFilter(): string[] | null {
  const raw = process.env.VISUAL_SCENARIO?.trim()
  if (!raw) return null
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
