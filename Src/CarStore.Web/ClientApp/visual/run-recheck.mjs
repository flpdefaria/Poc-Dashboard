#!/usr/bin/env node
/**
 * Token-cheap correction recheck inside an EXISTING bundle.
 *
 *   npm run visual:recheck -- <run-dir>                  re-run the scenarios of the open `defeito` items
 *   npm run visual:recheck -- <run-dir> <id>[,<id>…]     re-run named scenarios
 *   npm run visual:recheck -- <run-dir> --no-baseline    skip the previous-version capture
 *
 * <run-dir> defaults to qa-results/.current-run. The run appends attempt-NN to the bundle (earlier
 * attempts stay) and reuses the bundle's baseline commit unless --no-baseline.
 *
 * Output: one compact JSON on stdout (`recheck-summary.json` is written beside report.json too):
 * per previous defect `resolvido` / `persiste`, new failing rows, and only the image paths worth
 * opening. Open images only for items listed in `abrir[]`. It also writes `verdict-draft.json`
 * (the previous judgement minus resolved ids) to edit and pass to visual:verdict.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseArgs, runPlaywright } from './lib/launch.mjs'
import { collectDifferences } from './lib/findings.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ARTIFACT_ROOT = path.resolve(HERE, '..', '..', '..', '..', 'qa-results')

function fail(message) {
  console.error(`[visual:recheck] ${message}`)
  console.error('Usage: npm run visual:recheck -- [<run-dir>] [<scenario-id>[,…]] [--no-baseline]')
  process.exit(2)
}

const raw = process.argv.slice(2)
const noBaseline = raw.includes('--no-baseline')
const rest = raw.filter((a) => a !== '--no-baseline')
let runDir = null
const positional = []
for (const a of rest) {
  if (!a.startsWith('-') && !runDir && fs.existsSync(a) && fs.statSync(a).isDirectory()) runDir = a
  else positional.push(a)
}
const { ids: explicitIds, passthrough } = parseArgs(positional)

if (!runDir) {
  const pointer = path.join(ARTIFACT_ROOT, '.current-run')
  if (!fs.existsSync(pointer)) fail('No <run-dir> given and no qa-results/.current-run pointer.')
  runDir = fs.readFileSync(pointer, 'utf8').trim()
}
runDir = path.resolve(runDir)
const reportPath = path.join(runDir, 'report.json')
if (!fs.existsSync(reportPath)) fail(`No report.json in ${runDir}`)

const before = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const openDefects = (before.qaFindings?.diferencas ?? []).filter((d) => d.categoria === 'defeito')
const ids = explicitIds.length ? explicitIds : [...new Set(openDefects.map((d) => d.cenario))]
if (!ids.length) fail('No scenario ids given and the bundle has no open `defeito` items.')

process.env.QA_RUN_DIR = runDir
const baselineRef = noBaseline || !before.baseline?.enabled ? null : before.baseline.commit
console.error(`[visual:recheck] ${ids.join(',')} → ${runDir}${baselineRef ? ` (baseline ${baselineRef.slice(0, 12)})` : ''}`)

// Keep Playwright's own output off stdout so stdout stays a single JSON document.
const code = await runPlaywright({ ids, passthrough: [...passthrough, '--reporter=line'], baselineRef, stdio: ['ignore', 2, 2] })

const after = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const rechecked = new Set(ids)
const now = collectDifferences(after, runDir).filter((d) => rechecked.has(d.cenario) && d.status !== 'dynamic')
const nowById = new Map(now.map((d) => [d.id, d]))
const previousIds = new Set((before.qaFindings?.diferencas ?? []).map((d) => d.id))

const brief = (d) => ({ id: d.id, cenario: d.cenario, seletor: d.seletor, prop: d.prop ?? d.kind, esperado: d.esperado, atual: d.atual })
const defeitos = openDefects
  .filter((d) => rechecked.has(d.cenario))
  .map((d) => ({ ...brief(nowById.get(d.id) ?? d), estado: nowById.has(d.id) ? 'persiste' : 'resolvido' }))
const novas = now.filter((d) => !previousIds.has(d.id)).map(brief)

const scenarios = after.scenarios.filter((s) => rechecked.has(s.id))
const abrir = []
for (const s of scenarios) {
  // Differences already judged in an earlier attempt (and not defects) need no new look.
  const failing = [...defeitos.filter((d) => d.estado === 'persiste'), ...novas].some((d) => d.cenario === s.id)
  if (!failing) continue
  for (const sec of s.sections ?? []) {
    if (sec.outcome === 'fail') abrir.push(sec.comparison?.diffImage ?? sec.actualImage)
  }
  if (!(s.sections ?? []).length) abrir.push(s.triptychImage ?? s.actualImage)
}

// Draft verdict: the last recorded judgement, minus judgements whose difference no longer exists
// (visual:verdict rejects unknown ids). QA edits only the `persiste` / `novas` items and the result.
const allNow = new Set(collectDifferences(after, runDir).map((d) => d.id))
const last = (after.verdictHistory ?? []).at(-1)
let draft = null
if (last) {
  const keep = (j) => j.id?.startsWith('manual:') || allNow.has(j.id)
  const { recordedAt: _r, attempt: _a, ...rest } = last
  draft = path.join(runDir, 'verdict-draft.json')
  fs.writeFileSync(draft, JSON.stringify({
    ...rest,
    result: defeitos.some((d) => d.estado === 'persiste') || novas.length ? 'FAIL' : rest.result,
    diferencas: (rest.diferencas ?? []).filter(keep),
    minimas: (rest.minimas ?? []).filter(keep),
  }, null, 2) + '\n')
}

const summary = {
  exitCode: code,
  runDir,
  attempt: after.latestAttempt,
  verdictDraft: draft,
  cenarios: scenarios.map((s) => ({ id: s.id, status: s.status, spec: s.specComparison ? `${s.specComparison.passed}/${s.specComparison.total}` : null, erro: s.error })),
  defeitos,
  novas,
  abrir: [...new Set(abrir.filter(Boolean))],
  proximo: 'Classifique só `persiste` e `novas` no verdictDraft (adicione `novas` em diferencas/minimas, ajuste result e criteria) e rode npm run visual:verdict -- <verdictDraft> <runDir>.',
}
fs.writeFileSync(path.join(runDir, 'recheck-summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
process.exit(code)
