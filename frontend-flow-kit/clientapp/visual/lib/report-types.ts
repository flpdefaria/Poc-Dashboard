/**
 * report.json contract (`frontend-visual-check/5`; /5 adds per-scenario `sections` (per-section comparison with
 * dynamic height and data-driven exceptions), `wholeScreenInformational` and the `dynamic` count of the spec
 * comparison, all optional for older reports; /4 adds `device`, `deviceDerived`, `figmaNode`,
 * `state` and `responsiveFindings` to each scenario, all optional for older reports). Shared by the Playwright spec,
 * global setup/teardown, and — through `report-render.d.mts` /
 * `verdict.d.mts` — the plain-JS renderer and verdict CLI.
 */
import type { FigmaSpec, ScenarioDevice, ScenarioViewport } from '../types'
import type { ComparisonResult } from './compare'
import type { SpecComparison } from './spec-check'

export type { SpecCheckResult, SpecComparison } from './spec-check'

export interface BlockedRequest {
  url: string
  method: string
  resourceType: string
  reason: 'unmocked-api' | 'external-origin'
}

/**
 * - `captured`: taken from the base-commit server during this attempt.
 * - `reused`: an earlier attempt of this run already captured it.
 * - `absent-at-base`: the component/preview does not exist or never became
 *   ready at the base commit.
 * - `blocked`: baseline capture failed for another reason (see `baselineError`).
 * - `disabled`: no baseline requested for this run.
 */
export type BaselineStatus = 'captured' | 'reused' | 'absent-at-base' | 'blocked' | 'disabled'

/**
 * - `passed`: pixels equal within tolerance, size equal.
 * - `differences`: same size, pixels above tolerance (a finding).
 * - `dimension-mismatch`: width, or the height of a `fixed` section, differs (a finding; never rescaled).
 * - `partial-region`: a `dynamic` section whose height differs; only the common top strip was compared.
 * - `data-driven`: pixel diff accepted as information because masking the text removes it (`reason` shown).
 * - `blocked`: the section could not be captured or has no reference PNG.
 */
export type SectionStatus =
  | 'passed'
  | 'differences'
  | 'dimension-mismatch'
  | 'partial-region'
  | 'data-driven'
  | 'blocked'

export interface SectionResult {
  id: string
  label: string
  captureSelector: string
  figmaNodeId: string
  heightMode: 'fixed' | 'dynamic'
  dataDriven: boolean
  /** Extra data-dependent boxes masked in the audit (see `VisualSection.maskSelectors`). */
  maskSelectors?: string[]
  reason: string | null
  figmaNote: string | null
  /** `reference/<scenario>.<section>.png`, relative to the run directory. */
  figmaImage: string | null
  /** `actual/attempt-NN/<scenario>.<section>.png`. */
  actualImage: string | null
  figma: { width: number; height: number } | null
  actual: { width: number; height: number } | null
  status: SectionStatus
  /** `ok` and `fail` drive the scenario status; `info` (data-driven) caps it at `partial`. */
  outcome: 'ok' | 'fail' | 'info' | 'blocked'
  /** `dynamic`: the height differs but is declared content-dependent (information, no pass/fail). */
  heightStatus: 'match' | 'dynamic' | 'mismatch' | 'unknown'
  heightInfo: string | null
  /** Set when a 1px rounding difference (fractional DOM box) was tolerated and the common area compared. */
  sizeNote?: string | null
  widthOk: boolean | null
  /** Full-size comparison, or the dimension mismatch; for `partial-region` it compares the top strip. */
  comparison: ComparisonResult | null
  region: {
    comparedHeight: number
    figmaHeight: number
    actualHeight: number
    caption: string
    figmaImage: string | null
    actualImage: string | null
  } | null
  /** Diff with the text boxes masked in both images (only when the raw diff failed). */
  masked: {
    mismatchedPixels: number
    comparedPixels: number
    mismatchRatio: number
    tolerance: number
    passed: boolean
    maskedBoxes: number
    maskedAreaRatio: number
    diffImage: string | null
  } | null
  findings: string[]
}

export interface ScenarioResult {
  id: string
  label: string
  componentPath: string
  /**
   * Figma parity (pixels + spec) only — the baseline never changes this.
   * `partial`: only one of PNG / spec was available, and it passed.
   */
  status: 'passed' | 'differences' | 'partial' | 'not-applicable' | 'blocked'
  attempt: number
  previewUrl: string
  viewport: ScenarioViewport
  theme: string
  locale: string
  captureSelector: string
  actualImage: string | null
  referenceImage: string | null
  /** Optional reason there is no reference image (from the scenario's `referenceNote`). */
  referenceNote?: string | null
  /** Device class: the scenario's `device`, or derived from the viewport width (see `deviceDerived`). */
  device?: ScenarioDevice
  /** `true` when `device` was derived from `viewport.width` because the scenario did not set it. */
  deviceDerived?: boolean
  /** Figma node of the reference (scenario `figmaNode`; falls back to the spec source in the renderer). */
  figmaNode?: { nodeId: string; url?: string; name?: string } | null
  /** Scenario `state` label; set for non-main states (empty, loading, ...). */
  state?: string | null
  /** Number of `responsiveCheck` findings; `null` when the scenario has no responsiveCheck. */
  responsiveFindings?: number | null
  comparison: ComparisonResult | null
  /** Per-section comparison; absent for scenarios without `sections`. */
  sections?: SectionResult[]
  /** `true` when `sections` exist: `comparison` (whole screen) is information, the status comes from sections + spec. */
  wholeScreenInformational?: boolean
  findings: string[]
  missingEvidence: { item: string; reason: string }[]
  blockedRequests: BlockedRequest[]
  fulfilledMocks: string[]
  error: string | null
  /** `baseline/<id>.png`, relative to the run directory. */
  baselineImage: string | null
  baselineStatus: BaselineStatus
  baselineError: string | null
  /** reference = baseline (previous), actual = current capture. */
  baselineComparison: ComparisonResult | null
  /** reference = Figma, actual = baseline (previous). */
  baselineVsReference: ComparisonResult | null
  /** previous | current | figma (missing panes omitted). */
  triptychImage: string | null
  /** Content of `reference/<id>.figma.json`, embedded so the page stays offline. */
  figmaSpec: FigmaSpec | null
  figmaSpecError: string | null
  /** Figma spec vs the current render. */
  specComparison: SpecComparison | null
  /** Figma spec vs the previous (baseline) render. */
  baselineSpecComparison: SpecComparison | null
}

export type RunStatus = 'passed' | 'differences' | 'partial' | 'blocked'

export interface AttemptRecord {
  attempt: number
  directory: string
  completedAt: string
  scenarios: ScenarioResult[]
}

export interface BaselineInfo {
  enabled: boolean
  ref: string | null
  commit: string | null
  worktreePath: string | null
  depsStrategy: 'junction' | 'npm-ci' | null
  /** Scenario ids whose current capture differs from the base capture (info only). */
  changedScenarios?: string[]
}

export type EvidenceStatus = 'pass' | 'fail' | 'blocked'

export interface Verdict {
  result: 'PASS' | 'FAIL' | 'BLOCKED'
  criteria: { text: string; status: EvidenceStatus; evidence: string[] }[]
  notes?: string[]
  recordedAt?: string
  attempt?: number
  diferencas?: QaDifference[]
  minimas?: QaDifference[]
  bloqueios?: string[]
}

export interface Report {
  schema: 'frontend-visual-check/6'
  runStatus: RunStatus
  component: string
  generatedAt: string
  latestAttempt: number
  attempts: AttemptRecord[]
  scenarios: ScenarioResult[]
  findings: { scenarioId: string; finding: string }[]
  blockedRequests: { scenarioId: string; url: string; method: string; reason: string }[]
  missingEvidence: { scenarioId: string; item: string; reason: string }[]
  baseline: BaselineInfo
  verdict?: Verdict
  verdictHistory?: Verdict[]
  qaFindings?: QaFindings
}

export interface QaDifference {
  id: string
  cenario: string
  seletor: string
  esperado: unknown
  atual: unknown
  categoria: 'defeito' | 'decisao-design' | 'backend' | 'artefato-harness' | 'intencional' | 'conteudo-dinamico' | 'nao-classificado'
  imagem: string | null
  motivo: string
  kind?: string
  status?: string
  prop?: string
}
export interface QaFindings {
  status: 'PASS' | 'FAIL' | 'BLOCKED'
  base: { ref: string | null; commit: string | null }
  attempt: number
  diferencas: QaDifference[]
  minimas: QaDifference[]
  bloqueios: string[]
}
