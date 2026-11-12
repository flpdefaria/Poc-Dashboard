#!/usr/bin/env node
/** Record frontend QA judgement; regenerate findings.md and offline HTML.
 * Usage: npm run visual:verdict -- <verdict.json> <bundle>
 * With only <bundle>, re-render the recorded judgement.
 */
import fs from 'node:fs'
import path from 'node:path'

import { applyVerdict } from './lib/verdict.mjs'
import { ARTIFACT_DIR, REPO_ROOT } from './lib/project.mjs'

const ARTIFACT_ROOT = path.join(REPO_ROOT, ARTIFACT_DIR)

function usage(message) {
  if (message) console.error(`[visual:verdict] ${message}`)
  console.error('Usage: npm run visual:verdict -- <verdict.json> [--run-dir <bundle-dir>]')
  process.exit(2)
}

const args = process.argv.slice(2)
let runDir = process.env.QA_RUN_DIR || process.env.VISUAL_RUN_DIR || null
let verdictFile = null
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--run-dir') runDir = args[++i] ?? usage('--run-dir needs a value')
  else if (a.startsWith('--run-dir=')) runDir = a.slice('--run-dir='.length)
  else if (a === '-h' || a === '--help') usage()
  // A positional directory is the run dir; a positional file is the verdict.
  else if (fs.existsSync(a) && fs.statSync(a).isDirectory() && !runDir) runDir = a
  else if (!verdictFile) verdictFile = a
  else usage(`Unexpected argument "${a}"`)
}
// Windows PowerShell drops `--` before npm.ps1, so npm swallows `--run-dir`
// as its own config; recover it from there.
if (!runDir && process.env.npm_config_run_dir && process.env.npm_config_run_dir !== 'true') {
  runDir = process.env.npm_config_run_dir
}

if (!runDir) {
  const pointer = path.join(ARTIFACT_ROOT, '.current-run')
  if (!fs.existsSync(pointer)) usage('No --run-dir given and no .current-run pointer exists.')
  runDir = fs.readFileSync(pointer, 'utf8').trim()
}
runDir = path.resolve(runDir)
if (!fs.existsSync(runDir)) usage(`Run directory does not exist: ${runDir}`)

let verdict = null
if (verdictFile) {
  try {
    // Strip a UTF-8 BOM (Windows PowerShell 5.1 writes one by default).
    verdict = JSON.parse(fs.readFileSync(path.resolve(verdictFile), 'utf8').replace(/^﻿/, ''))
  } catch (error) {
    usage(`Cannot read verdict JSON ${verdictFile}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

try {
  const { report, warnings } = applyVerdict(runDir, verdict)
  for (const w of warnings) console.warn(`[visual:verdict] warning: ${w}`)
  console.log(
    `[visual:verdict] ${report.verdict ? `verdict ${report.verdict.result}` : 'no verdict'}, ` +
      `findings: ${path.join(runDir, 'findings.md')}`,
  )
} catch (error) {
  console.error(`[visual:verdict] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
