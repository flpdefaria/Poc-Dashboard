import fs from 'node:fs'
import path from 'node:path'
import { ARTIFACT_DIR, CLIENT_APP_ROOT as PROJECT_CLIENT_APP_ROOT, REPO_ROOT as PROJECT_REPO_ROOT } from './project.mjs'

/** Client app directory (`clientAppDir` in `visual/project.json`). */
export const CLIENT_APP_ROOT = PROJECT_CLIENT_APP_ROOT
/** Repository root. */
export const REPO_ROOT = PROJECT_REPO_ROOT
/** Where every review bundle lands (`artifactDir`, default `qa-results/` at the repository root). */
export const ARTIFACT_ROOT = path.join(REPO_ROOT, ARTIFACT_DIR)
/** Checked-in reference images, one `<scenario-id>.png` per scenario. */
export const REFERENCE_SOURCE_DIR = path.join(CLIENT_APP_ROOT, 'visual', 'references')

const POINTER_FILE = path.join(ARTIFACT_ROOT, '.current-run')

export function utcStamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z')
}

export function slugify(value: string): string {
  return (
    value
      .replace(/\.vue$/i, '')
      .split('/')
      .pop()!
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'component'
  )
}

export function attemptDirName(n: number): string {
  return `attempt-${String(n).padStart(2, '0')}`
}

/**
 * Resolve the run directory for this process.
 *
 * `globalSetup` creates it and publishes it on `process.env.QA_RUN_DIR`
 * (workers inherit the parent env) plus a pointer file as a fallback for
 * tooling started separately.
 */
export function configuredRunDir(): string | undefined {
  const current = process.env.QA_RUN_DIR
  const legacy = process.env.VISUAL_RUN_DIR
  if (current && legacy && path.resolve(current) !== path.resolve(legacy)) {
    throw new Error('QA_RUN_DIR and deprecated VISUAL_RUN_DIR disagree.')
  }
  if (!current && legacy) console.warn('[visual] VISUAL_RUN_DIR is deprecated; use QA_RUN_DIR.')
  return current || legacy ? path.resolve(current || legacy!) : undefined
}

export function currentRunDir(): string {
  const fromEnv = configuredRunDir()
  if (fromEnv) return fromEnv
  if (fs.existsSync(POINTER_FILE)) {
    return fs.readFileSync(POINTER_FILE, 'utf8').trim()
  }
  throw new Error(
    'No visual run directory. Run through `npm run visual:check` so globalSetup can create one.',
  )
}

export function publishRunDir(runDir: string): void {
  process.env.QA_RUN_DIR = runDir
  fs.mkdirSync(ARTIFACT_ROOT, { recursive: true })
  fs.writeFileSync(POINTER_FILE, runDir, 'utf8')
}

/**
 * Next attempt number inside a run directory. Re-running with
 * `QA_RUN_DIR` pointing at an existing bundle appends `attempt-02`, … so
 * correction rounds keep every earlier screenshot.
 */
export function nextAttempt(runDir: string): number {
  const actual = path.join(runDir, 'actual')
  if (!fs.existsSync(actual)) return 1
  const used = fs
    .readdirSync(actual)
    .map((name) => /^attempt-(\d+)$/.exec(name)?.[1])
    .filter((v): v is string => Boolean(v))
    .map(Number)
  return used.length ? Math.max(...used) + 1 : 1
}

export function currentAttempt(): number {
  const raw = process.env.VISUAL_ATTEMPT
  if (!raw) throw new Error('VISUAL_ATTEMPT is not set; run through `npm run visual:check`.')
  return Number(raw)
}

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

export function readJsonIfExists<T>(file: string): T | undefined {
  if (!fs.existsSync(file)) return undefined
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}
