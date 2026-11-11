/** Review contract: raw measurements stay intact; only an evidenced QA judgement can accept a difference. */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { scenarioItems } from './report-render.mjs'

export const CATEGORIES = ['defeito', 'decisao-design', 'backend', 'artefato-harness', 'intencional', 'conteudo-dinamico']
const idFor = (scenario, key) => `${scenario}:${createHash('sha256').update(key).digest('hex').slice(0, 12)}`

/** Evidence must be a real file inside the bundle, including after resolving symlinks. */
export function evidenceExists(runDir, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) return false
  try {
    const root = fs.realpathSync(runDir)
    const file = fs.realpathSync(path.resolve(runDir, relative))
    return file.startsWith(root + path.sep) && fs.statSync(file).isFile()
  } catch { return false }
}

/** Collect measurements and pending classifications. IDs are stable between attempts. */
export function collectDifferences(report, runDir) {
  const result = []
  for (const s of report.scenarios ?? []) {
    const add = (key, values) => result.push({
      id: idFor(s.id, key), cenario: s.id, seletor: s.captureSelector ?? '',
      esperado: 'Requisito solicitado', atual: '', categoria: 'nao-classificado',
      imagem: s.actualImage ?? null, motivo: '', ...values,
    })
    for (const row of scenarioItems(s)) add(`${row.kind}:${row.nodeId}:${row.selector}:${row.prop}`, {
      seletor: row.selector, esperado: row.figma, atual: row.actual, categoria: row.category,
      motivo: row.category === 'nao-classificado' ? '' : row.text,
      kind: row.kind, prop: row.prop, status: row.status,
    })
    if (!s.wholeScreenInformational && s.comparison && s.comparison.status !== 'passed') {
      add('pixels', { kind: 'pixels', status: s.comparison.status, esperado: 'PNG do Figma',
        atual: s.comparison, motivo: '' })
    }
    const attempt = `attempt-${String(s.attempt).padStart(2, '0')}`
    const requirements = path.join(runDir, 'comparison', attempt, `${s.id}.requirements.json`)
    if (fs.existsSync(requirements)) {
      for (const c of JSON.parse(fs.readFileSync(requirements, 'utf8')).checks ?? []) {
        if (c.status === 'pass') continue
        add(`requirement:${c.selector}:${c.label}`, { kind: 'requirement', status: c.status,
          seletor: c.selector, esperado: { label: c.label, count: c.count, text: c.text, value: c.value },
          atual: c.observed, categoria: 'defeito', motivo: `Requisito não atendido: ${c.label}` })
      }
    }
    for (const f of s.findings ?? []) {
      if (!f.startsWith('Responsive:') && !f.startsWith('Requirement failed:')) continue
      if (f.startsWith('Requirement failed:') && fs.existsSync(requirements)) continue
      add(`finding:${f}`, { kind: 'requirement', status: 'fail', atual: f,
        categoria: 'defeito', motivo: f })
    }
  }
  return result
}

/** Minimality is a human decision, never a blanket threshold or an exemption for broken requirements. */
function canBeMinimal(item) {
  if (item.status === 'missing-element' || item.status === 'blocked') return false
  if (item.kind === 'pixels') return item.status === 'differences'
  if (item.kind !== 'spec' || item.status !== 'fail') return false
  // Text, dimensions/overflow, state, visibility and contrast must not be waived.
  return /^(padding|margin|gap|rowGap|columnGap|borderRadius|letterSpacing)/.test(item.prop ?? '')
}

export function buildFindings(report, runDir) {
  const verdict = report.verdict
  const differences = collectDifferences(report, runDir)
  const byId = new Map(differences.map(d => [d.id, d]))
  const minimal = []
  const blocks = [...(verdict?.bloqueios ?? [])]
  const used = new Set()
  for (const [isMinimal, judgments] of [[false, verdict?.diferencas ?? []], [true, verdict?.minimas ?? []]]) {
    for (const judgment of judgments) {
      if (used.has(judgment.id)) throw new Error(`Duplicate judgement: ${judgment.id}`)
      used.add(judgment.id)
      let item = byId.get(judgment.id)
      if (!item) {
        if (isMinimal || !judgment.id?.startsWith('manual:')) throw new Error(`Unknown difference id: ${judgment.id}`)
        const scenario = (report.scenarios ?? []).find(s => s.id === judgment.cenario)
        if (!scenario || !judgment.seletor || judgment.esperado == null || judgment.atual == null) {
          throw new Error(`Manual difference ${judgment.id} needs cenario, seletor, esperado and atual.`)
        }
        item = { ...judgment, kind: 'manual', imagem: scenario.actualImage }
        differences.push(item)
        byId.set(item.id, item)
      }
      if (!judgment.motivo?.trim()) throw new Error(`Judgement ${judgment.id} needs motivo.`)
      if (!evidenceExists(runDir, judgment.imagem ?? item.imagem)) blocks.push(`${judgment.id}: imagem de evidência ausente.`)
      if (isMinimal) {
        if (!canBeMinimal(item)) throw new Error(`Difference ${item.id} cannot be minimal (${item.kind}/${item.prop ?? item.status}).`)
        // A repeated spec error is systemic, even when each measurement is small.
        if (differences.filter(d => d.kind === 'spec' && d.prop === item.prop && d.cenario === item.cenario).length > 1) {
          throw new Error(`Repeated property ${item.prop} in ${item.cenario} cannot be minimal.`)
        }
        minimal.push({ ...item, motivo: judgment.motivo, imagem: judgment.imagem ?? item.imagem, categoria: 'intencional' })
      } else {
        if (!CATEGORIES.includes(judgment.categoria)) throw new Error(`Invalid categoria: ${judgment.categoria}`)
        Object.assign(item, { categoria: judgment.categoria, motivo: judgment.motivo, imagem: judgment.imagem ?? item.imagem })
      }
    }
  }
  const minIds = new Set(minimal.map(d => d.id))
  const remaining = differences.filter(d => !minIds.has(d.id))
  if (!verdict) blocks.push('Julgamento QA pendente: registrar critérios e revisão visual com visual:verdict.')
  if (verdict && verdict.attempt !== report.latestAttempt) blocks.push('Veredito de outra tentativa: repetir a revisão visual.')
  if (!(report.scenarios ?? []).length) blocks.push('Nenhum cenário capturado.')
  for (const s of report.scenarios ?? []) {
    if (!evidenceExists(runDir, s.actualImage)) blocks.push(`${s.id}: captura atual ausente.`)
    if (s.status === 'blocked' || s.error || s.blockedRequests?.length) blocks.push(`${s.id}: captura bloqueada ou mocks incompletos.`)
    if (s.baselineStatus === 'blocked') blocks.push(`${s.id}: baseline bloqueado (${s.baselineError ?? 'sem captura'}).`)
    if (s.status === 'partial' || s.figmaSpecError || (s.figmaNode && (!s.referenceImage || !s.figmaSpec))) {
      blocks.push(`${s.id}: evidência do Figma parcial ou indisponível.`)
    }
    if (s.theme !== 'dark' && !(report.scenarios ?? []).some(d => d.theme === 'dark'
      && d.componentPath === s.componentPath && d.viewport?.width === s.viewport?.width
      && (d.state ?? null) === (s.state ?? null) && d.locale === s.locale && evidenceExists(runDir, d.actualImage))) {
      blocks.push(`${s.id}: cenário escuro correspondente ausente.`)
    }
  }
  for (const d of remaining) {
    if (d.categoria === 'nao-classificado') blocks.push(`${d.id}: diferença sem classificação.`)
    if (['backend', 'artefato-harness', 'decisao-design'].includes(d.categoria)) blocks.push(`${d.id}: ${d.categoria} — ${d.motivo}`)
  }
  for (const c of verdict?.criteria ?? []) {
    if (c.status === 'blocked') blocks.push(`Critério bloqueado: ${c.text}`)
    if (!c.evidence?.length || c.evidence.some(e => !evidenceExists(runDir, e))) blocks.push(`Evidência ausente: ${c.text}`)
  }
  if (verdict && !verdict.criteria?.length) blocks.push('Nenhum critério revisado.')
  const failed = remaining.some(d => d.categoria === 'defeito') || verdict?.criteria?.some(c => c.status === 'fail') || verdict?.result === 'FAIL'
  if (verdict?.result === 'BLOCKED' && !blocks.length) blocks.push('QA registrou BLOCKED; consulte os critérios e notas.')
  return {
    status: blocks.length ? 'BLOCKED' : failed ? 'FAIL' : 'PASS',
    base: { ref: report.baseline?.ref ?? null, commit: report.baseline?.commit ?? null },
    attempt: report.latestAttempt, diferencas: remaining, minimas: minimal, bloqueios: [...new Set(blocks)],
  }
}

const cell = v => String(typeof v === 'object' ? JSON.stringify(v) : v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').replace(/</g, '&lt;')
const table = items => '| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |\n|---|---|---|---|---|---|---|---|\n' + items.map(d =>
  `| ${[d.id, d.cenario, d.seletor, d.esperado, d.atual, d.categoria].map(cell).join(' | ')} | ${d.imagem ? `[imagem](<${encodeURI(String(d.imagem).split('\\').join('/'))}>)` : 'ausente'} | ${cell(d.motivo)} |`).join('\n')

export function writeFindings(runDir, findings) {
  fs.writeFileSync(path.join(runDir, 'findings.md'), `# Findings QA\n\nstatus: **${findings.status}**\n\nbase: ${cell(findings.base.ref ?? 'desabilitada')} @ ${cell(findings.base.commit ?? '—')}\n\nattempt: ${findings.attempt}\n\n## diferencas[]\n\n${table(findings.diferencas)}\n\n## minimas[]\n\nSemelhantes por julgamento registrado; não geram correção.\n\n${table(findings.minimas)}\n\n## bloqueios\n\n${findings.bloqueios.length ? findings.bloqueios.map(b => `- ${cell(b)}`).join('\n') : 'Nenhum.'}\n\n[Relatório offline](index.html) · [Medições e julgamento](report.json)\n`)
}
