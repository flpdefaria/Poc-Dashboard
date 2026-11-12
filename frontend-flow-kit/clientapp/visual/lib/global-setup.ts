import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { scenarios as allScenarios } from '../scenarios'
import type { VisualScenario } from '../types'
import {
  ARTIFACT_ROOT,
  configuredRunDir,
  CLIENT_APP_ROOT,
  REFERENCE_SOURCE_DIR,
  REPO_ROOT,
  attemptDirName,
  nextAttempt,
  publishRunDir,
  slugify,
  utcStamp,
  writeJson,
} from './run-context'
import {
  API_BASE_PATH,
  BASE_URL,
  BASELINE_ENABLED,
  BASELINE_URL,
  baselineDir,
  DEFAULT_DEVICE_SCALE_FACTOR,
  FIXED_NOW,
  LOCALE_HINT,
  PREVIEW_PATH,
  TIMEZONE_ID,
  USES_HTTPS,
  scenarioFilter,
} from './config'
import { MISMATCH_RATIO_TOLERANCE, PIXELMATCH_THRESHOLD } from './compare'
import { DEFAULT_COLOR_TOLERANCE, DEFAULT_PX_TOLERANCE, loadSpec } from './spec-check'
import { PROJECT_NAME, clientAppPath } from './project.mjs'

function git(...args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function serializableScenario(s: VisualScenario) {
  return {
    id: s.id,
    label: s.label,
    componentPath: s.componentPath,
    props: s.props ?? {},
    localStorageSeed: s.localStorageSeed ?? {},
    route: s.route ?? null,
    viewport: s.viewport,
    theme: s.theme,
    locale: s.locale,
    captureSelector: s.captureSelector,
    actions: s.actions ?? [],
    baselineActions: s.baselineActions ?? s.actions ?? [],
    renderChecks: s.renderChecks ?? [],
    sections: s.sections ?? [],
    now: s.now ?? FIXED_NOW,
    notes: s.notes ?? null,
    previewUrl: `${PREVIEW_PATH}?scenario=${encodeURIComponent(s.id)}`,
  }
}

function serializableMocks(s: VisualScenario) {
  return {
    scenarioId: s.id,
    apiBasePath: API_BASE_PATH,
    policy:
      'Declared mocks are fulfilled from these fixtures. Every other request under the API ' +
      'base path is aborted and recorded — the preview never reaches a real backend.',
    mocks: (s.mocks ?? []).map((m) => ({
      urlPattern: m.urlPattern instanceof RegExp ? m.urlPattern.source : m.urlPattern,
      urlPatternKind: m.urlPattern instanceof RegExp ? 'regexp' : 'substring',
      status: m.status,
      contentType: m.contentType,
      body: m.body,
      delayMs: m.delayMs,
      responses: m.responses,
    })),
  }
}

export default function globalSetup(): void {
  const filter = scenarioFilter()
  const selected = filter ? allScenarios.filter((s) => filter.includes(s.id)) : allScenarios

  if (filter) {
    const unknown = filter.filter((id) => !allScenarios.some((s) => s.id === id))
    if (unknown.length) {
      throw new Error(
        `Unknown scenario id(s): ${unknown.join(', ')}. Known: ${allScenarios
          .map((s) => s.id)
          .join(', ')}`,
      )
    }
  }
  if (!selected.length) {
    throw new Error('No scenarios selected — the registry is empty.')
  }

  const slugs = [...new Set(selected.map((s) => slugify(s.componentPath)))]
  const componentSlug = slugs.length === 1 ? slugs[0] : 'multi-component'

  // Reusing a run directory (correction rounds) keeps every earlier attempt.
  const reuse = configuredRunDir()
  if (reuse && !fs.existsSync(path.join(reuse, 'report.json'))) {
    throw new Error(`QA_RUN_DIR must point to an existing bundle with report.json: ${reuse}`)
  }
  const runDir =
    reuse && fs.existsSync(reuse)
      ? reuse
      : path.join(ARTIFACT_ROOT, `${utcStamp()}-${componentSlug}`)

  const attempt = nextAttempt(runDir)
  const attemptName = attemptDirName(attempt)

  fs.mkdirSync(path.join(runDir, 'reference'), { recursive: true })
  fs.mkdirSync(path.join(runDir, 'actual', attemptName), { recursive: true })
  fs.mkdirSync(path.join(runDir, 'comparison', attemptName), { recursive: true })
  fs.mkdirSync(path.join(runDir, 'data'), { recursive: true })
  fs.mkdirSync(path.join(runDir, '.results'), { recursive: true })
  if (BASELINE_ENABLED) fs.mkdirSync(path.join(runDir, 'baseline'), { recursive: true })

  // Copy any checked-in reference image into the bundle so it stays offline
  // and self-contained. A missing reference is recorded, never faked.
  type SpecStatus = { path: string | null; nodeId?: string; retrievedAt?: string; reason?: string }
  const referenceStatus: Record<
    string,
    {
      path: string | null
      reason?: string
      figmaSpec: SpecStatus
      sections?: Record<string, { nodeId: string; path: string | null }>
    }
  > = {}
  for (const s of selected) {
    const src = path.join(REFERENCE_SOURCE_DIR, `${s.id}.png`)
    const specSrc = path.join(REFERENCE_SOURCE_DIR, `${s.id}.figma.json`)
    let figmaSpec: SpecStatus
    if (fs.existsSync(specSrc)) {
      fs.copyFileSync(specSrc, path.join(runDir, 'reference', `${s.id}.figma.json`))
      const loaded = loadSpec(specSrc)
      figmaSpec = loaded.spec
        ? {
            path: `reference/${s.id}.figma.json`,
            nodeId: loaded.spec.source.nodeId,
            retrievedAt: loaded.spec.source.retrievedAt,
          }
        : { path: `reference/${s.id}.figma.json`, reason: `Invalid Figma spec: ${loaded.error}` }
    } else {
      figmaSpec = {
        path: null,
        reason: `No Figma spec at visual/references/${s.id}.figma.json (qa-agent writes it from the Figma MCP).`,
      }
    }
    // Per-section Figma PNGs (<scenario>.<section>.png, exported from the child node).
    const sectionRefs: Record<string, { nodeId: string; path: string | null }> = {}
    for (const sec of s.sections ?? []) {
      const secSrc = path.join(REFERENCE_SOURCE_DIR, `${s.id}.${sec.id}.png`)
      if (fs.existsSync(secSrc)) {
        fs.copyFileSync(secSrc, path.join(runDir, 'reference', `${s.id}.${sec.id}.png`))
        sectionRefs[sec.id] = { nodeId: sec.figmaNodeId, path: `reference/${s.id}.${sec.id}.png` }
      } else {
        sectionRefs[sec.id] = { nodeId: sec.figmaNodeId, path: null }
      }
    }
    const sectionsField = s.sections?.length ? { sections: sectionRefs } : {}
    if (fs.existsSync(src)) {
      const dest = path.join(runDir, 'reference', `${s.id}.png`)
      fs.copyFileSync(src, dest)
      referenceStatus[s.id] = { path: `reference/${s.id}.png`, figmaSpec, ...sectionsField }
    } else {
      referenceStatus[s.id] = {
        path: null,
        reason:
          `No reference image at visual/references/${s.id}.png. Export the Figma frame at the ` +
          `scenario viewport and device scale factor and save it there.`,
        figmaSpec,
        ...sectionsField,
      }
    }
  }

  writeJson(path.join(runDir, 'data', 'scenarios.json'), {
    generatedAt: new Date().toISOString(),
    attempt,
    scenarios: selected.map(serializableScenario),
  })
  writeJson(path.join(runDir, 'data', 'mocks.json'), {
    generatedAt: new Date().toISOString(),
    perScenario: selected.map(serializableMocks),
  })
  writeJson(path.join(runDir, 'data', 'capture-config.json'), {
    tool: 'playwright',
    browsers: ['chromium'],
    baseUrl: BASE_URL,
    previewPath: PREVIEW_PATH,
    https: USES_HTTPS,
    ignoreHttpsErrors: true,
    timezoneId: TIMEZONE_ID,
    fixedNow: FIXED_NOW,
    localeHint: LOCALE_HINT,
    defaultDeviceScaleFactor: DEFAULT_DEVICE_SCALE_FACTOR,
    reducedMotion: 'reduce',
    screenshotAnimations: 'disabled',
    screenshotScope: 'element',
    serviceWorkers: 'blocked',
    apiBasePath: API_BASE_PATH,
    comparison: {
      algorithm: 'pixelmatch',
      threshold: PIXELMATCH_THRESHOLD,
      mismatchRatioTolerance: MISMATCH_RATIO_TOLERANCE,
      rescaling: 'never',
    },
    figmaSpecCheck: {
      source: 'visual/references/<id>.figma.json',
      pxTolerance: DEFAULT_PX_TOLERANCE,
      colorChannelTolerance: DEFAULT_COLOR_TOLERANCE,
      measuredOn: 'getBoundingClientRect + getComputedStyle inside captureSelector',
    },
  })
  writeJson(path.join(runDir, 'data', 'provenance.json'), {
    generatedAt: new Date().toISOString(),
    attempt,
    command: process.argv.slice(1).join(' '),
    cwd: CLIENT_APP_ROOT,
    repoRoot: REPO_ROOT,
    git: {
      branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
      commit: git('rev-parse', 'HEAD'),
      dirty: (git('status', '--porcelain') ?? '') !== '',
    },
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    harness: {
      project: PROJECT_NAME,
      previewEntry: clientAppPath('visual/preview.html'),
      previewScript: clientAppPath('visual/preview.ts'),
      appSetup: clientAppPath('visual/app-setup.ts'),
      spec: clientAppPath('visual/capture.spec.ts'),
      config: clientAppPath('playwright.config.ts'),
    },
    references: referenceStatus,
    baseline: {
      enabled: BASELINE_ENABLED,
      ref: BASELINE_ENABLED ? (process.env.VISUAL_BASELINE_REF_LABEL ?? null) : null,
      commit: BASELINE_ENABLED ? (process.env.VISUAL_BASELINE_SHA ?? null) : null,
      worktreePath: baselineDir(),
      depsStrategy: BASELINE_ENABLED ? (process.env.VISUAL_BASELINE_DEPS ?? null) : null,
      url: BASELINE_ENABLED ? BASELINE_URL : null,
    },
  })

  if (process.env.VISUAL_BASELINE_REF && !BASELINE_ENABLED) {
    console.warn(
      '[visual] VISUAL_BASELINE_REF is set but no baseline worktree was prepared. ' +
        'Use `npm run visual:compare` or `npm run visual:check:scenario` so the launcher prepares it.',
    )
  }

  publishRunDir(runDir)
  process.env.VISUAL_ATTEMPT = String(attempt)
  console.log(`[visual] run bundle: ${runDir} (${attemptName})`)
}
