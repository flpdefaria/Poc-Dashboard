/**
 * Project settings for the visual harness, read from `visual/project.json`.
 *
 * Plain ESM so the Node launchers, Playwright config, Vite config and the TS
 * library can all share it. Nothing in the engine hardcodes the project name,
 * the client-app location or ports: change `project.json`, not this file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** `visual/project.json` (one level above `lib/`). */
export const PROJECT_FILE = path.resolve(HERE, '..', 'project.json')

function load() {
  if (!fs.existsSync(PROJECT_FILE)) {
    throw new Error(`[visual] Missing ${PROJECT_FILE}. Copy it from the frontend-flow-kit and fill it in.`)
  }
  const raw = JSON.parse(fs.readFileSync(PROJECT_FILE, 'utf8'))
  for (const key of ['projectName', 'clientAppDir']) {
    if (typeof raw[key] !== 'string' || /\{\{.*\}\}/.test(raw[key])) {
      throw new Error(`[visual] ${PROJECT_FILE}: "${key}" is not configured (still a {{placeholder}}).`)
    }
  }
  return raw
}

const raw = load()

/** Display name used in report titles. */
export const PROJECT_NAME = String(raw.projectName)
/** Client app directory (holds package.json, vite.config.ts, src/, visual/). */
export const CLIENT_APP_ROOT = path.resolve(HERE, '..', '..')
/**
 * Client app path segments relative to the repository root, from
 * `clientAppDir` ("." or "" when the client app IS the repository root).
 */
export const CLIENT_APP_REL = String(raw.clientAppDir)
  .replace(/\\/g, '/')
  .split('/')
  .filter((s) => s && s !== '.')
/** Repository root: CLIENT_APP_ROOT minus `clientAppDir`. */
export const REPO_ROOT = CLIENT_APP_REL.reduce((dir) => path.dirname(dir), CLIENT_APP_ROOT)

if (CLIENT_APP_REL.length && path.join(REPO_ROOT, ...CLIENT_APP_REL) !== CLIENT_APP_ROOT) {
  throw new Error(
    `[visual] project.json clientAppDir "${raw.clientAppDir}" does not match the harness location ${CLIENT_APP_ROOT}.`,
  )
}

/** Repo-relative POSIX path of the client app ("" at the root), for messages and provenance. */
export const CLIENT_APP_PATH = CLIENT_APP_REL.join('/')
/** Prefix `p` with the client-app path, for repo-relative messages. */
export function clientAppPath(p) {
  return CLIENT_APP_PATH ? `${CLIENT_APP_PATH}/${p}` : p
}

export const USES_HTTPS = Boolean(raw.devServerHttps)
export const API_BASE_PATH = String(raw.apiBasePath ?? '/api')
export const FIXED_NOW = String(raw.fixedNow ?? '2026-01-15T12:00:00Z')
export const LOCALE_HINT = String(raw.locale ?? 'en-US')
export const TIMEZONE_ID = String(raw.timezone ?? 'UTC')
export const DEFAULT_PREVIEW_PORT = Number(raw.previewPort) || 5175
export const BASELINE_PORT = Number(raw.baselinePort) || 5174
/** Repo-relative folder for review bundles. */
export const ARTIFACT_DIR = String(raw.artifactDir ?? 'qa-results')
