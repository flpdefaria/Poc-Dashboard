/** Frontend-only QA judgement, kept separate from raw pixel/spec measurements. */
import fs from 'node:fs'
import path from 'node:path'
import { writeRunPages } from './report-render.mjs'
import { buildFindings, writeFindings } from './findings.mjs'

export function normalizeVerdict(raw, _runDir, _warnings = []) {
  if (!raw || !['PASS', 'FAIL', 'BLOCKED'].includes(raw.result)) throw new Error('Verdict result must be PASS, FAIL or BLOCKED.')
  if (raw.workItem || raw.live) throw new Error('workItem/live are not part of the frontend QA contract.')
  if (!Array.isArray(raw.criteria)) throw new Error('Verdict criteria must be an array.')
  const criteria = raw.criteria.map((c, i) => {
    if (!['pass', 'fail', 'blocked'].includes(c?.status) || !c.text?.trim()) throw new Error(`Invalid criteria[${i}].`)
    if (!Array.isArray(c.evidence) || c.evidence.some(e => typeof e !== 'string')) throw new Error(`Invalid criteria[${i}].evidence.`)
    return { text: c.text, status: c.status, evidence: c.evidence }
  })
  for (const key of ['diferencas', 'minimas', 'bloqueios', 'notes']) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) throw new Error(`${key} must be an array.`)
  }
  return { result: raw.result, criteria, diferencas: raw.diferencas ?? [], minimas: raw.minimas ?? [],
    bloqueios: raw.bloqueios ?? [], notes: raw.notes ?? [], recordedAt: new Date().toISOString() }
}

export function applyVerdict(runDir, rawVerdict) {
  const reportPath = path.join(runDir, 'report.json')
  if (!fs.existsSync(reportPath)) throw new Error(`No report.json in ${runDir}. Run visual:compare first.`)
  const warnings = []
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  if (rawVerdict) report.verdict = { ...normalizeVerdict(rawVerdict, runDir, warnings), attempt: report.latestAttempt }
  // Legacy bundles remain readable; obsolete live/card data is not carried into the new contract.
  delete report.live
  if (report.verdict) delete report.verdict.workItem
  report.schema = 'carstore-visual-check/6'
  report.baseline ??= { enabled: false, ref: null, commit: null, worktreePath: null, depsStrategy: null }
  report.qaFindings = buildFindings(report, runDir)
  if (report.verdict && report.verdict.result !== report.qaFindings.status) {
    warnings.push(`Requested ${report.verdict.result}; evidence requires ${report.qaFindings.status}. See findings.md.`)
    report.verdict.result = report.qaFindings.status
  }
  writeFindings(runDir, report.qaFindings)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
  writeRunPages(runDir, report, path.dirname(runDir))
  return { report, warnings }
}
