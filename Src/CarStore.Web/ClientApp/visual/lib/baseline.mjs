/**
 * Baseline ("previous version") support for the visual harness.
 *
 * Plain ESM on purpose: the launchers (`run-scenario.mjs`, `run-compare.mjs`)
 * are plain Node scripts and must prepare the worktree BEFORE Playwright's
 * webServer starts. Types live in `baseline.d.mts`.
 *
 * The base commit is checked out into `<repoRoot>/.visual-baseline/<short-sha>`
 * with `git worktree add --detach`. Only the CURRENT
 * `Src/CarStore.Web/ClientApp/visual/` harness (plus `playwright.config.ts` and
 * `tsconfig.visual.json`) is overlaid on top of it; the base's production code
 * is never modified.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** ClientApp path segments relative to the repository root. */
export const CLIENT_APP_REL = ['Src', 'CarStore.Web', 'ClientApp']
/** `Src/CarStore.Web/ClientApp` of the current checkout. */
export const CLIENT_APP_ROOT = path.resolve(HERE, '..', '..')
/** Repository root of the current checkout. */
export const REPO_ROOT = path.resolve(CLIENT_APP_ROOT, '..', '..', '..')
/** Parent directory of every baseline worktree (git-ignored). */
export const BASELINE_ROOT = path.join(REPO_ROOT, '.visual-baseline')
/** Port the baseline dev server listens on. */
export const BASELINE_PORT = 5174

/** @param {string[]} args */
function git(...args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

/** @param {string[]} args */
function tryGit(...args) {
  try {
    return git(...args)
  } catch {
    return null
  }
}

/**
 * Resolve `VISUAL_BASELINE_REF` (or the explicit argument) to a commit.
 * `auto` = `git merge-base HEAD origin/main`, then `merge-base HEAD main`,
 * then `main` itself.
 *
 * @param {string} [raw]
 * @returns {{ ref: string, sha: string }}
 */
export function resolveBaselineRef(raw = process.env.VISUAL_BASELINE_REF ?? 'auto') {
  const requested = raw.trim() || 'auto'
  if (requested === 'auto') {
    const candidates = [
      ['merge-base(HEAD, origin/main)', () => tryGit('merge-base', 'HEAD', 'origin/main')],
      ['merge-base(HEAD, main)', () => tryGit('merge-base', 'HEAD', 'main')],
      ['main', () => tryGit('rev-parse', '--verify', 'main^{commit}')],
    ]
    for (const [label, resolve] of candidates) {
      const sha = resolve()
      if (sha) return { ref: label, sha }
    }
    throw new Error('VISUAL_BASELINE_REF=auto: neither origin/main nor main could be resolved.')
  }
  const sha = tryGit('rev-parse', '--verify', `${requested}^{commit}`)
  if (!sha) throw new Error(`VISUAL_BASELINE_REF="${requested}" is not a valid git ref.`)
  return { ref: requested, sha }
}

/** @param {string} sha */
export function baselineWorktreePath(sha) {
  // Short SHA keeps Windows paths under MAX_PATH for deep repository files.
  return path.join(BASELINE_ROOT, sha.slice(0, 12))
}

/** @param {string} file */
function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file) : null
}

/** @param {string} p */
function isLink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

/**
 * Remove a junction/symlink WITHOUT touching its target. Must run before
 * `git worktree remove`, which could otherwise recurse into the current
 * checkout's `node_modules`.
 *
 * @param {string} p
 */
function unlinkLink(p) {
  if (!isLink(p)) return
  try {
    fs.unlinkSync(p)
  } catch {
    fs.rmdirSync(p)
  }
}

/**
 * Create (or reuse) the baseline worktree and overlay the current harness.
 *
 * @param {string} sha
 * @returns {{ worktreePath: string, clientAppDir: string, depsStrategy: 'junction' | 'npm-ci', viteCacheDir: string | null }}
 */
export function prepareBaselineWorktree(sha) {
  const worktreePath = baselineWorktreePath(sha)
  const clientAppDir = path.join(worktreePath, ...CLIENT_APP_REL)

  const registered = (tryGit('worktree', 'list', '--porcelain') ?? '')
    .split(/\r?\n/)
    .filter((l) => l.startsWith('worktree '))
    .map((l) => path.resolve(l.slice('worktree '.length)))
  const alreadyRegistered = registered.some((p) => p.toLowerCase() === path.resolve(worktreePath).toLowerCase())

  if (!alreadyRegistered) {
    if (fs.existsSync(worktreePath)) {
      // Stale directory from an interrupted run: git would refuse to reuse it.
      unlinkLink(path.join(clientAppDir, 'node_modules'))
      fs.rmSync(worktreePath, { recursive: true, force: true })
      tryGit('worktree', 'prune')
    }
    fs.mkdirSync(BASELINE_ROOT, { recursive: true })
    git('worktree', 'add', '--detach', worktreePath, sha)
  }

  if (!fs.existsSync(clientAppDir)) {
    throw new Error(`Base commit ${sha} has no ${CLIENT_APP_REL.join('/')} directory.`)
  }

  // Overlay the CURRENT harness. Remove the base's own visual/ first so stale
  // base-only files cannot leak into the preview.
  const visualSrc = path.join(CLIENT_APP_ROOT, 'visual')
  const visualDst = path.join(clientAppDir, 'visual')
  fs.rmSync(visualDst, { recursive: true, force: true })
  fs.cpSync(visualSrc, visualDst, { recursive: true, force: true })
  const tsconfigVisual = path.join(CLIENT_APP_ROOT, 'tsconfig.visual.json')
  if (fs.existsSync(tsconfigVisual)) {
    fs.copyFileSync(tsconfigVisual, path.join(clientAppDir, 'tsconfig.visual.json'))
  }
  // The base may predate the harness: it needs the current Playwright config too.
  fs.copyFileSync(path.join(CLIENT_APP_ROOT, 'playwright.config.ts'), path.join(clientAppDir, 'playwright.config.ts'))

  // Dependencies: share the current node_modules when the lockfile matches,
  // otherwise install the base's own exact tree.
  const currentLock = readIfExists(path.join(CLIENT_APP_ROOT, 'package-lock.json'))
  const baseLock = readIfExists(path.join(clientAppDir, 'package-lock.json'))
  const sameLock = currentLock !== null && baseLock !== null && currentLock.equals(baseLock)
  const nodeModules = path.join(clientAppDir, 'node_modules')

  /** @type {'junction' | 'npm-ci'} */
  let depsStrategy
  let viteCacheDir = null
  if (sameLock) {
    depsStrategy = 'junction'
    if (!isLink(nodeModules)) {
      fs.rmSync(nodeModules, { recursive: true, force: true })
      fs.symlinkSync(path.join(CLIENT_APP_ROOT, 'node_modules'), nodeModules, 'junction')
    }
    // Never share Vite's optimizer cache with the current dev server.
    viteCacheDir = path.join(CLIENT_APP_ROOT, 'node_modules', '.vite-visual-baseline')
  } else {
    depsStrategy = 'npm-ci'
    unlinkLink(nodeModules)
    const marker = path.join(nodeModules, '.visual-baseline-installed')
    if (!fs.existsSync(marker)) {
      console.log(`[visual] base package-lock.json differs — running npm ci in ${clientAppDir}`)
      const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
        cwd: clientAppDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        // Keep husky from rewriting the shared repository's hook config.
        env: { ...process.env, HUSKY: '0' },
      })
      if (result.status !== 0) throw new Error(`npm ci failed in baseline worktree (exit ${result.status}).`)
      fs.writeFileSync(marker, sha, 'utf8')
    }
  }

  return { worktreePath, clientAppDir, depsStrategy, viteCacheDir }
}

/**
 * Remove every baseline worktree created from this checkout (or just the
 * given one). Skipped when `VISUAL_KEEP_BASELINE=1`.
 *
 * @param {string} [worktreePath]
 * @returns {boolean} whether anything was removed
 */
export function removeBaselineWorktree(worktreePath = process.env.VISUAL_BASELINE_DIR) {
  if (process.env.VISUAL_KEEP_BASELINE === '1') {
    console.log(`[visual] VISUAL_KEEP_BASELINE=1 — keeping ${worktreePath ?? BASELINE_ROOT}`)
    return false
  }
  if (!worktreePath) return false
  unlinkLink(path.join(worktreePath, ...CLIENT_APP_REL, 'node_modules'))
  tryGit('worktree', 'remove', '--force', worktreePath)
  if (fs.existsSync(worktreePath)) fs.rmSync(worktreePath, { recursive: true, force: true })
  tryGit('worktree', 'prune')
  try {
    if (fs.existsSync(BASELINE_ROOT) && fs.readdirSync(BASELINE_ROOT).length === 0) fs.rmdirSync(BASELINE_ROOT)
  } catch {
    /* best effort */
  }
  return true
}

/**
 * Resolve + prepare in one step and return the env block every launcher
 * exports to Playwright.
 *
 * @param {string} [raw]
 * @returns {Record<string, string>}
 */
export function prepareBaselineEnv(raw) {
  const { ref, sha } = resolveBaselineRef(raw)
  console.log(`[visual] baseline ref ${ref} → ${sha}`)
  const prepared = prepareBaselineWorktree(sha)
  console.log(`[visual] baseline worktree ${prepared.worktreePath} (deps: ${prepared.depsStrategy})`)
  /** @type {Record<string, string>} */
  const env = {
    VISUAL_BASELINE_SHA: sha,
    VISUAL_BASELINE_REF_LABEL: ref,
    VISUAL_BASELINE_DIR: prepared.worktreePath,
    VISUAL_BASELINE_DEPS: prepared.depsStrategy,
  }
  if (prepared.viteCacheDir) env.VISUAL_BASELINE_VITE_CACHE = prepared.viteCacheDir
  return env
}
