import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { applyVerdict } from './verdict.mjs'
import { buildFindings, collectDifferences, evidenceExists } from './findings.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'carstore-qa-contract-'))
  const dir = path.join(root, 'run')
  fs.mkdirSync(dir)
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  // Synthetic files test path validation, never used as visual-review evidence.
  fs.writeFileSync(path.join(dir, 'light.png'), 'contract fixture')
  fs.writeFileSync(path.join(dir, 'dark.png'), 'contract fixture')
  const scenario = { id: 'light', theme: 'light', componentPath: 'Example.vue', locale: 'en-US',
    captureSelector: '.example', viewport: { width: 1280, height: 720 }, status: 'not-applicable',
    actualImage: 'light.png', attempt: 1, findings: [], blockedRequests: [], missingEvidence: [] }
  const report = { schema: 'carstore-visual-check/6', latestAttempt: 1, runStatus: 'partial', component: 'Example.vue',
    scenarios: [scenario, { ...scenario, id: 'dark', theme: 'dark', actualImage: 'dark.png' }],
    attempts: [], baseline: { ref: 'HEAD', commit: 'abc', enabled: false } }
  const verdict = { result: 'PASS', criteria: [{ text: 'Requested state in both themes', status: 'pass', evidence: ['light.png', 'dark.png'] }] }
  const apply = (v = verdict) => {
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report))
    return applyVerdict(dir, v).report
  }
  return { dir, report, verdict, apply }
}

test('capture without review is BLOCKED; evidenced text review may PASS without Figma parity', t => {
  const f = fixture(t)
  assert.equal(buildFindings(f.report, f.dir).status, 'BLOCKED')
  const result = f.apply()
  assert.equal(result.qaFindings.status, 'PASS')
  assert.equal(result.scenarios[0].status, 'not-applicable')
  assert.match(fs.readFileSync(path.join(f.dir, 'findings.md'), 'utf8'), /status: \*\*PASS/)
  assert.doesNotMatch(fs.readFileSync(path.join(f.dir, 'index.html'), 'utf8'), /Live validation|Work item:/)
})

test('isolated spacing may be judged minimal while raw measurement stays failed', t => {
  const f = fixture(t)
  f.report.scenarios[0].specComparison = { results: [{ nodeId: 'n', selector: '.example', prop: 'gap', expected: 10, actual: 12, status: 'fail' }] }
  const difference = collectDifferences(f.report, f.dir)[0]
  const result = f.apply({ ...f.verdict, minimas: [{ id: difference.id, motivo: 'Isolated spacing is visually equivalent.', imagem: 'light.png' }] })
  assert.equal(result.qaFindings.status, 'PASS')
  assert.equal(result.qaFindings.minimas.length, 1)
  assert.equal(result.qaFindings.diferencas.length, 0)
  assert.equal(result.scenarios[0].specComparison.results[0].status, 'fail')
})

test('defect and failed criterion cannot be accepted by requested PASS', t => {
  const f = fixture(t)
  f.report.scenarios[0].findings.push('Responsive: horizontal overflow')
  assert.equal(f.apply().verdict.result, 'FAIL')
  f.report.scenarios[0].findings = []
  assert.equal(f.apply({ ...f.verdict, criteria: [{ ...f.verdict.criteria[0], status: 'fail' }] }).verdict.result, 'FAIL')
})

test('missing local evidence including JSON, empty criteria and missing dark coverage block PASS', t => {
  const f = fixture(t)
  assert.equal(f.apply({ ...f.verdict, criteria: [{ ...f.verdict.criteria[0], evidence: ['missing.json'] }] }).qaFindings.status, 'BLOCKED')
  assert.equal(f.apply({ ...f.verdict, criteria: [] }).qaFindings.status, 'BLOCKED')
  f.report.scenarios.pop()
  assert.equal(f.apply().qaFindings.status, 'BLOCKED')
})

test('missing-element, wrong text, overflow and repeated errors cannot be minimal', t => {
  for (const [prop, status] of [['gap', 'missing-element'], ['text', 'fail'], ['width', 'fail']]) {
    const f = fixture(t)
    f.report.scenarios[0].specComparison = { results: [{ nodeId: 'n', selector: '.example', prop, status, expected: 10, actual: 12 }] }
    const d = collectDifferences(f.report, f.dir)[0]
    assert.throws(() => f.apply({ ...f.verdict, minimas: [{ id: d.id, motivo: 'small' }] }), /cannot be minimal/)
  }
  const f = fixture(t)
  f.report.scenarios[0].specComparison = { results: ['a', 'b'].map(nodeId => ({ nodeId, selector: `.${nodeId}`, prop: 'gap', status: 'fail', expected: 10, actual: 12 })) }
  assert.throws(() => f.apply({ ...f.verdict, minimas: [{ id: collectDifferences(f.report, f.dir)[0].id, motivo: 'small' }] }), /Repeated property/)
})

test('stale judgement, partial Figma and unclassified measurements block PASS', t => {
  const f = fixture(t)
  f.report.verdict = { ...f.verdict, attempt: 0 }
  assert.equal(buildFindings(f.report, f.dir).status, 'BLOCKED')
  f.report.scenarios[0].status = 'partial'
  assert.equal(f.apply().qaFindings.status, 'BLOCKED')
  f.report.scenarios[0].status = 'differences'
  f.report.scenarios[0].comparison = { status: 'differences', algorithm: 'pixelmatch', threshold: 0.1, mismatchTolerance: 0,
    reference: { width: 1280, height: 720 }, actual: { width: 1280, height: 720 }, mismatchedPixels: 50, comparedPixels: 921600,
    mismatchRatio: 50 / 921600, diffImage: null, sideBySideImage: null, findings: [] }
  assert.equal(f.apply().qaFindings.status, 'BLOCKED')
})

test('path traversal and symlink escape are not evidence', t => {
  const f = fixture(t)
  const outside = path.join(path.dirname(f.dir), 'outside.png')
  fs.writeFileSync(outside, 'not evidence')
  fs.symlinkSync(outside, path.join(f.dir, 'escape.png'))
  assert.equal(evidenceExists(f.dir, '../outside.png'), false)
  assert.equal(evidenceExists(f.dir, 'escape.png'), false)
  assert.equal(evidenceExists(f.dir, '.'), false)
  assert.equal(evidenceExists(f.dir, 'light.png'), true)
})

test('live/card inputs rejected and unknown minimal ids cannot hide differences', t => {
  const f = fixture(t)
  assert.throws(() => f.apply({ ...f.verdict, workItem: { id: 1 } }), /not part/)
  assert.throws(() => f.apply({ ...f.verdict, minimas: [{ id: 'unknown', motivo: 'small' }] }), /Unknown difference/)
})
