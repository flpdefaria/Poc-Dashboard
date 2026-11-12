/**
 * Shared launcher for `run-scenario.mjs` and `run-compare.mjs`.
 *
 * When a baseline ref is requested, the worktree is prepared BEFORE
 * Playwright starts (its webServer needs the directory to exist) and is
 * always removed afterwards unless VISUAL_KEEP_BASELINE=1.
 */
import { spawn } from 'node:child_process'

import {
  CLIENT_APP_ROOT,
  baselineWorktreePath,
  prepareBaselineEnv,
  removeBaselineWorktree,
  resolveBaselineRef,
} from './baseline.mjs'

/**
 * @param {{ ids: string[], passthrough: string[], baselineRef?: string | null, stdio?: import('node:child_process').StdioOptions }} options
 * @returns {Promise<number>} exit code
 */
export async function runPlaywright({ ids, passthrough, baselineRef, stdio = 'inherit' }) {
  /** @type {Record<string, string>} */
  const env = { ...process.env }
  if (ids.length) env.VISUAL_SCENARIO = ids.join(',')

  /** @type {string | null} */
  let worktree = null
  if (baselineRef) {
    try {
      // Path known up front so a half-prepared worktree is still cleaned up.
      worktree = baselineWorktreePath(resolveBaselineRef(baselineRef).sha)
      Object.assign(env, prepareBaselineEnv(baselineRef))
    } catch (error) {
      console.error(`[visual] baseline preparation failed: ${error instanceof Error ? error.message : String(error)}`)
      if (worktree) removeBaselineWorktree(worktree)
      return 1
    }
  }

  const cleanup = () => {
    if (worktree) {
      removeBaselineWorktree(worktree)
      worktree = null
    }
  }

  try {
    return await new Promise((resolve) => {
      const child = spawn('npx', ['playwright', 'test', 'visual/capture.spec.ts', ...passthrough], {
        cwd: CLIENT_APP_ROOT,
        stdio,
        shell: process.platform === 'win32',
        env,
      })
      const forward = (/** @type {NodeJS.Signals} */ signal) => child.kill(signal)
      process.once('SIGINT', forward)
      process.once('SIGTERM', forward)
      child.on('exit', (code) => {
        process.off('SIGINT', forward)
        process.off('SIGTERM', forward)
        resolve(code ?? 1)
      })
      child.on('error', (error) => {
        console.error(`[visual] failed to start Playwright: ${error.message}`)
        resolve(1)
      })
    })
  } finally {
    cleanup()
  }
}

/** Split CLI args into scenario ids (comma lists allowed) and `-` flags. */
export function parseArgs(argv = process.argv.slice(2)) {
  const ids = argv
    .filter((a) => !a.startsWith('-'))
    .flatMap((a) => a.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
  const passthrough = argv.filter((a) => a.startsWith('-'))
  return { ids, passthrough }
}
