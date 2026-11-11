import fs from 'node:fs'
import path from 'node:path'

import type {
  AttemptRecord,
  BaselineInfo,
  Report,
  RunStatus,
  ScenarioResult,
} from './report-types'
import {
  ARTIFACT_ROOT,
  attemptDirName,
  currentAttempt,
  currentRunDir,
  readJsonIfExists,
  writeJson,
} from './run-context'
import { writeRunPages } from './report-html'
import { buildFindings, writeFindings } from './findings.mjs'

/** Figma parity (pixels + spec) only; baseline differences are informational. */
function runStatusOf(scenarios: ScenarioResult[]): RunStatus {
  if (!scenarios.length) return 'blocked'
  const captured = scenarios.filter((s) => s.actualImage)
  if (!captured.length) return 'blocked'
  if (scenarios.some((s) => s.status === 'differences')) return 'differences'
  if (scenarios.some((s) => s.status === 'blocked' || s.status === 'not-applicable' || s.status === 'partial'))
    return 'partial'
  return 'passed'
}

function collectResults(runDir: string): ScenarioResult[] {
  const dir = path.join(runDir, '.results')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as ScenarioResult)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function baselineInfo(runDir: string, scenarios: ScenarioResult[], previous?: Report): BaselineInfo {
  const provenance = readJsonIfExists<{ baseline?: BaselineInfo }>(
    path.join(runDir, 'data', 'provenance.json'),
  )
  const fromRun = provenance?.baseline
  const info: BaselineInfo =
    fromRun?.enabled
      ? { ...fromRun }
      : previous?.baseline?.enabled
        ? { ...previous.baseline }
        : fromRun ?? { enabled: false, ref: null, commit: null, worktreePath: null, depsStrategy: null }
  info.changedScenarios = scenarios
    .filter((s) => s.baselineComparison && s.baselineComparison.status !== 'passed')
    .map((s) => s.id)
  return info
}

export default function globalTeardown(): void {
  let runDir: string
  try {
    runDir = currentRunDir()
  } catch {
    return
  }
  if (!fs.existsSync(runDir)) return

  const attempt = currentAttempt()
  const currentResults = collectResults(runDir)
  const reportPath = path.join(runDir, 'report.json')
  const previous = readJsonIfExists<Report>(reportPath)
  // A targeted correction must not erase the rest of the run's device/theme matrix.
  const latestById = new Map((previous?.scenarios ?? []).map((s) => [s.id, s]))
  for (const result of currentResults) latestById.set(result.id, result)
  const scenarios = [...latestById.values()].sort((a, b) => a.id.localeCompare(b.id))

  const attemptRecord: AttemptRecord = {
    attempt,
    directory: `actual/${attemptDirName(attempt)}`,
    completedAt: new Date().toISOString(),
    scenarios: currentResults,
  }
  const attempts = [
    ...(previous?.attempts ?? []).filter((a) => a.attempt !== attempt),
    attemptRecord,
  ].sort((a, b) => a.attempt - b.attempt)

  const component =
    [...new Set(scenarios.map((s) => s.componentPath))].join(', ') ||
    previous?.component ||
    'unknown'


  const report: Report = {
    schema: 'carstore-visual-check/6',
    runStatus: runStatusOf(scenarios),
    component,
    generatedAt: new Date().toISOString(),
    latestAttempt: attempt,
    attempts,
    scenarios,
    findings: scenarios.flatMap((s) => s.findings.map((f) => ({ scenarioId: s.id, finding: f }))),
    blockedRequests: scenarios.flatMap((s) =>
      s.blockedRequests.map((b) => ({
        scenarioId: s.id,
        url: b.url,
        method: b.method,
        reason: b.reason,
      })),
    ),
    missingEvidence: scenarios.flatMap((s) =>
      s.missingEvidence.map((m) => ({ scenarioId: s.id, item: m.item, reason: m.reason })),
    ),
    baseline: baselineInfo(runDir, scenarios, previous),
    // A correction invalidates the old decision, while keeping it for audit.
    verdictHistory: [...(previous?.verdictHistory ?? []), ...(previous?.verdict ? [previous.verdict] : [])],
  }

  report.qaFindings = buildFindings(report, runDir)
  writeFindings(runDir, report.qaFindings)
  writeJson(reportPath, report)
  writeRunPages(runDir, report, ARTIFACT_ROOT)
  fs.rmSync(path.join(runDir, '.results'), { recursive: true, force: true })

  console.log(
    `[visual] ${report.runStatus} — report: ${path.join(runDir, 'index.html')}`,
  )
}
