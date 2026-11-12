import type { Component } from 'vue'

/** A single API response the preview is allowed to answer. */
export interface ScenarioMockResponse {
  status: number
  contentType: string
  /** Serialized as-is when a string, JSON-stringified otherwise. */
  body: unknown
  /** Bounded response delay for observing genuine request-in-progress UI. */
  delayMs?: number
}

export interface ScenarioMock extends ScenarioMockResponse {
  /**
   * Matched against the full request URL with `String.prototype.includes`
   * when a plain string, or `RegExp.test` when a regular expression.
   */
  urlPattern: string | RegExp
  /** Successive responses; after the last response, repeat it. */
  responses?: ScenarioMockResponse[]
}

/** A browser interaction performed after mount but before the screenshot. */
export interface ScenarioAction {
  type: 'hover' | 'click' | 'focus' | 'press' | 'wait' | 'expect-text' | 'expect-value' | 'expect-count' | 'fill' | 'scroll-right' | 'reload' | 'expect-local-storage'
  /** Expected text/value or fill value; exact for value, substring for text. */
  value?: string
  /** Bypass Playwright's actionability check when the scenario deliberately tests an aria-disabled target. */
  force?: boolean
  /** Expected matched element count. */
  count?: number
  /** CSS selector — required for every type except `wait`. */
  selector?: string
  /** localStorage key, required for `expect-local-storage`. */
  key?: string
  /** Milliseconds, `wait` only. */
  ms?: number
}

export interface ScenarioViewport {
  width: number
  height: number
  deviceScaleFactor: number
}

export interface ScenarioRoute {
  /** Path the memory router starts on. */
  path: string
  /** Route params exposed through `useRoute().params`. */
  params?: Record<string, string>
  /** Query exposed through `useRoute().query`. */
  query?: Record<string, string>
  /** `route.meta` the component may read. */
  meta?: Record<string, unknown>
}

/** Computed-style properties a Figma spec check can assert. Lengths are CSS px. */
export type FigmaCheckProp =
  | 'width'
  | 'height'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'gap'
  | 'borderRadius'
  | 'borderWidth'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'opacity'
  /** SVG `stroke-width` in px (Figma `--p-icon-stroke-width`); measured on the `<svg>` element. */
  | 'strokeWidth'

export interface FigmaCheckTolerance {
  /** Allowed absolute difference for lengths, in CSS px. Default 1. */
  px?: number
  /** Allowed per-channel difference for colors (0–255). Default 2. */
  color?: number
}

/**
 * One assertion derived from a Figma node. `expected` values come from Figma,
 * never from the current render.
 */
export interface FigmaCheck {
  nodeId: string
  /** Human name of the Figma layer, for the report. */
  nodeName?: string
  /** CSS selector resolved inside `captureSelector`; `:scope` is the capture root. */
  selector: string
  /** Numbers are CSS px for lengths; colors as hex, rgb() or rgba(). */
  props?: Partial<Record<FigmaCheckProp, number | string>>
  /** Expected text (whitespace-collapsed substring of the element's innerText). */
  text?: string
  /** A CSS custom property the element must resolve to the token's value. */
  token?: { name: string; cssVar: string; expected: string }
  tolerance?: FigmaCheckTolerance
  /**
   * The Figma value depends on the content (row/item count) of the prototype, not on layout. The
   * check is still measured and shown (Figma, current, difference) with status `dynamic`, but it
   * counts neither as pass nor as fail. Requires `dynamicReason`. Never use it for colors,
   * paddings, typography or widths.
   */
  dynamic?: boolean
  dynamicReason?: string
}

/**
 * Sidecar `visual/references/<scenario-id>.figma.json`, written by qa-agent from
 * the Figma MCP (get_metadata, get_design_context, get_variable_defs,
 * get_code_connect_map, get_screenshot). Persisted next to the PNG and checked
 * automatically against the rendered DOM.
 */
export interface FigmaSpec {
  source: {
    url: string
    fileKey: string
    nodeId: string
    nodeName?: string
    /** ISO timestamp of the MCP retrieval. */
    retrievedAt: string
    /** Figma MCP tools whose output this spec was built from. */
    tools: string[]
  }
  /** Natural node size in CSS px (not the export size). */
  frame?: {
    width: number
    height: number
    exportScale?: number
    /** The frame height follows the content (table rows, ranking items): `frame.height` becomes a `dynamic` row. */
    heightDynamic?: boolean
    heightDynamicReason?: string
  }
  tree?: {
    id: string
    name: string
    type: string
    bounds?: { x: number; y: number; width: number; height: number }
    componentName?: string
    variant?: Record<string, string>
  }[]
  tokens?: { name: string; collection?: string; mode?: string; value: string; cssVar?: string }[]
  texts?: { nodeId: string; text: string }[]
  codeConnect?: { nodeId: string; component: string; source?: string }[]
  primevue?: { nodeId: string; component: string; status: 'verified' | 'unresolved' }[]
  checks: FigmaCheck[]
  notes?: string[]
  /**
   * QA registry of WHY a spec row or a section does not pass (fail, missing-element, dynamic). Written by
   * qa-agent, never derived from the render and never used as an expected value: the report's "Resumo" tab
   * shows it next to each item and counts the items per category. Items without a match are listed as
   * `nao-classificado` ("sem explicação registrada").
   */
  explanations?: FigmaExplanation[]
}

/**
 * - `defeito`: real defect of the implementation (goes back to the developer).
 * - `backend`: the data or rule comes from the backend (missing field, pending business rule).
 * - `decisao-design`: deliberate deviation or an inconsistency of the prototype itself, pending/decided by design.
 * - `artefato-harness`: caused by the mocked harness (no shell, viewport mode), not by the view.
 * - `intencional`: documented, accepted divergence (e.g. a newer frame wins over an older one).
 * - `conteudo-dinamico`: value follows the content (row/item count, fixture values).
 */
export type ExplanationCategory =
  | 'defeito'
  | 'backend'
  | 'decisao-design'
  | 'artefato-harness'
  | 'intencional'
  | 'conteudo-dinamico'

/**
 * One registry entry. A spec row matches when every given key (`nodeId`, `selector`, `prop`) is equal; the
 * entry with more keys wins. A section entry sets only `section` (the `VisualSection.id`).
 */
export interface FigmaExplanation {
  nodeId?: string
  selector?: string
  /** One property or a list (`paddingTop`, `frame.height`, `text`, ...). */
  prop?: string | string[]
  /** Section id; when set, the entry explains that section's pixel/size result and no spec row. */
  section?: string
  category: ExplanationCategory
  /** Short explanation in Portuguese, read by the reviewer. */
  text: string
}

export interface VisualScenario {
  /** Requirement assertions, measured only on current after capture; never Figma evidence. */
  renderChecks?: {
    label: string
    selector: string
    count?: number
    text?: string
    value?: string
  }[]
  /** Stable, filename-safe identifier. Also the reference-image basename. */
  id: string
  /** Human label shown in the report. */
  label: string
  /** Repo-relative path of the component under test, for provenance. */
  componentPath: string
  /** Lazy loader for the REAL component — never a stub. */
  component: () => Promise<{ default: Component } | Component>
  props?: Record<string, unknown>
  /**
   * `localStorage` entries to seed before the component module loads. The
   * preview already writes the theme key from `theme` (see `applyTheme` in
   * `visual/app-setup.ts`); seed any other persisted UI state here (palette
   * mode, collapsed sidebar, ...).
   */
  localStorageSeed?: Record<string, string>
  route?: ScenarioRoute
  /**
   * Named routes the component resolves (links such as `{ name: 'orders' }`).
   * The preview registers a stub route per name; without it `router.resolve` throws
   * "No match for {name:…}" and the view reports a render error after painting.
   */
  routeNames?: string[]
  viewport: ScenarioViewport
  theme: 'light' | 'dark'
  locale: string
  /** CSS selector of the element to screenshot. Never the full page. */
  captureSelector: string
  /**
   * Fixed CSS-px width for the mount root (block, no padding). Without it `#preview-root` is a
   * shrink-to-fit inline-block, so full-width page views (`w-full`) render narrower than the
   * viewport. Set it to the Figma frame width when comparing whole screens.
   */
  mountWidth?: number
  /**
   * Mobile / responsive measurements taken on the same page state as the screenshot (see
   * README "Mobile / responsivo"): horizontal overflow, interactive targets smaller than
   * `minTouchTarget` (default 44px) and clipped text. Written to
   * `comparison/attempt-NN/<id>.responsive.json`; results become findings, not pixel/spec failures.
   */
  responsiveCheck?: { minTouchTarget?: number }
  actions?: ScenarioAction[]
  /** Alternate interactions for the previous-version capture when the new flow is absent at base. */
  baselineActions?: ScenarioAction[]
  mocks?: ScenarioMock[]
  /**
   * Defect-reproduction scenario: substring of a documented production render error. When the
   * preview fails with it, the genuine error state is captured (full page) and `renderChecks`
   * run against it, so the defect is reported as a failed requirement instead of a blocked
   * capture. Once fixed, the scenario renders and is checked normally.
   */
  expectedRenderError?: string
  /** ISO instant the browser `Date` is pinned to. Defaults to `fixedNow` in `visual/project.json`. */
  now?: string
  /** Optional notes surfaced verbatim in the report. */
  notes?: string
  /**
   * Why the scenario has no Figma reference image, shown in the report's Figma column instead of
   * the generic message. Examples: 'no Figma frame for this theme/state', 'reference not exported
   * yet', 'Figma file unreadable (MCP error ...)'. Ignored when a reference PNG exists.
   */
  referenceNote?: string
  /**
   * Device class of the scenario, used by the report's "Dispositivo × Tema" matrix and section order.
   * When omitted the report derives it from `viewport.width` (>= 1280 desktop, >= 768 tablet,
   * otherwise mobile) and marks it as derived. Set it explicitly for the main scenarios.
   */
  device?: ScenarioDevice
  /**
   * The Figma node this scenario's reference (`references/<id>.png` + `.figma.json`) comes from.
   * Shown in the matrix cell and in the Figma column. When omitted the report falls back to
   * `source.nodeId` / `source.url` of the Figma spec, if one exists.
   */
  figmaNode?: { nodeId: string; url?: string; name?: string }
  /**
   * Marks a scenario that is not the screen with data (for example `empty`, `loading`, `header ES`).
   * Scenarios with a `state` are listed in the report's "Outros estados" group and never fill the
   * matrix; the value is the label shown in their badge.
   */
  state?: string
  /**
   * Per-section comparison (see README "Seções e altura dinâmica"). When present, the scenario status
   * comes from the sections and the Figma spec; the whole-screen pixel comparison stays in the report
   * as information only. A scenario without `sections` behaves as before.
   */
  sections?: VisualSection[]
}

/**
 * One block of the screen compared on its own with the Figma node of the same block. The Figma PNG is
 * `visual/references/<scenario-id>.<section-id>.png`: `get_screenshot` of the CHILD node, not a crop of the frame.
 */
export interface VisualSection {
  /** Filename-safe, unique inside the scenario (`kpis`, `table`...). Also the reference-image suffix. */
  id: string
  label: string
  /**
   * CSS selector of the block in the preview document (use the `data-testid`s). When it matches more
   * than one element the union bounding box is captured (for example the title + the KPI grid).
   */
  captureSelector: string
  /** Figma node the reference PNG was exported from. */
  figmaNodeId: string
  /**
   * `fixed`: width AND height are required, a size mismatch is a finding.
   * `dynamic`: the height follows the content; width is required, height is information
   * (`altura depende do conteúdo`) and, if it differs, only the common top strip is compared (`partial-region`).
   */
  heightMode: 'fixed' | 'dynamic'
  /**
   * The pixel differences come from fixture values that differ from the prototype (R$ amounts, counts,
   * names, copy), not from layout. The pixel diff becomes informational (`data-driven`) and the scenario
   * can then be at best `partial`. The harness re-measures the diff with the text boxes masked and
   * turns the section back into a failure if the diff survives. Requires `reason`.
   */
  dataDriven?: boolean
  /** Why: mandatory with `dataDriven`, recommended with `dynamic`. Shown in the report for audit. */
  reason?: string
  /**
   * Only for the `dataDriven` audit: CSS selectors (inside the section) of non-text elements whose size or
   * position comes from the data, such as the width of a ranking bar. Their boxes are masked together with the
   * text boxes. Declare the same in `reason`; layout, color and typography elements never belong here.
   */
  maskSelectors?: string[]
  /** Free note about the Figma export (for example "exported 690px wide, cropped to the left 640px"). */
  figmaNote?: string
}

export type ScenarioDevice = 'desktop' | 'tablet' | 'mobile'
