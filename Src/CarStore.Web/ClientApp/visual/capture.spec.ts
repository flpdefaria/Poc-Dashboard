import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Browser, type BrowserContext, type Page, type Route } from '@playwright/test'

import { scenarios as allScenarios } from './scenarios'
import type { ScenarioMock, VisualScenario } from './types'
import {
  API_BASE_PATH,
  BASE_URL,
  BASELINE_ENABLED,
  BASELINE_URL,
  FIXED_NOW,
  PREVIEW_PATH,
  TIMEZONE_ID,
  scenarioFilter,
} from './lib/config'
import {
  attemptDirName,
  currentAttempt,
  currentRunDir,
  writeJson,
} from './lib/run-context'
import { compareImages, writeTriptych, type ComparisonResult } from './lib/compare'
import type { BaselineStatus, BlockedRequest, ScenarioResult, SectionResult } from './lib/report-types'
import {
  blockedSection,
  captureSection,
  compareSection,
  validateSections,
  type SectionCapture,
} from './lib/sections'
import { collectResponsive, responsiveFindings } from './lib/responsive-check'
import { deviceFromWidth } from './lib/report-html'
import { collectComputed, compareSpec, loadSpec, type ComputedSnapshot } from './lib/spec-check'
import type { FigmaSpec } from './types'

export type { BlockedRequest, ScenarioResult } from './lib/report-types'

/**
 * Strip credentials before anything is written to the report: query strings
 * and userinfo routinely carry tokens.
 */
function sanitizeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    u.username = ''
    u.password = ''
    u.hash = ''
    const hadQuery = u.search.length > 0
    u.search = ''
    return u.toString() + (hadQuery ? '?<redacted>' : '')
  } catch {
    return raw.split('?')[0] + '?<unparseable>'
  }
}

function matchesMock(mock: ScenarioMock, url: string): boolean {
  return mock.urlPattern instanceof RegExp
    ? mock.urlPattern.test(url)
    : url.includes(mock.urlPattern)
}

function isApiRequest(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith(API_BASE_PATH)
  } catch {
    return url.includes(API_BASE_PATH)
  }
}

function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === new URL(origin).origin
  } catch {
    return false
  }
}

/**
 * `origin` is the dev server the page is loaded from: the current checkout
 * (5175) or the baseline worktree (5174). Only that origin is allowed.
 */
async function installRouting(
  context: BrowserContext,
  scenario: VisualScenario,
  blocked: BlockedRequest[],
  fulfilled: string[],
  origin: string,
): Promise<void> {
  const mocks = scenario.mocks ?? []
  const responseCounts = new Map<ScenarioMock, number>()

  await context.route('**/*', async (route: Route) => {
    const request = route.request()
    const url = request.url()

    const mock = mocks.find((m) => matchesMock(m, url))
    if (mock) {
      const count = responseCounts.get(mock) ?? 0
      responseCounts.set(mock, count + 1)
      const response = mock.responses?.[Math.min(count, mock.responses.length - 1)] ?? mock
      const body = typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
      fulfilled.push(sanitizeUrl(url))
      if (response.delayMs) await new Promise((resolve) => setTimeout(resolve, Math.min(10_000, Math.max(0, response.delayMs!))))
      await route.fulfill({
        status: response.status,
        contentType: response.contentType,
        body,
      })
      return
    }

    if (isApiRequest(url)) {
      blocked.push({
        url: sanitizeUrl(url),
        method: request.method(),
        resourceType: request.resourceType(),
        reason: 'unmocked-api',
      })
      await route.abort('blockedbyclient')
      return
    }

    if (!isSameOrigin(url, origin)) {
      blocked.push({
        url: sanitizeUrl(url),
        method: request.method(),
        resourceType: request.resourceType(),
        reason: 'external-origin',
      })
      await route.abort('blockedbyclient')
      return
    }

    await route.continue()
  })
}

const PREVIEW_READY_TIMEOUT = 30_000
/** The baseline server starts with a cold optimizer cache. */
const BASELINE_READY_TIMEOUT = 45_000

/**
 * Load the preview from `origin`, run the scenario's actions and write an
 * element screenshot to `outPath`. Throws on any failure.
 */
async function captureScenario(
  browser: Browser,
  scenario: VisualScenario,
  origin: string,
  outPath: string,
  blocked: BlockedRequest[],
  fulfilled: string[],
  readyTimeout: number,
  /** Runs on the same page state as the screenshot, before the context closes. */
  inspect?: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: scenario.viewport.width, height: scenario.viewport.height },
    deviceScaleFactor: scenario.viewport.deviceScaleFactor,
    colorScheme: scenario.theme,
    locale: scenario.locale,
    timezoneId: TIMEZONE_ID,
    reducedMotion: 'reduce',
    ignoreHTTPSErrors: true,
    // A stale service worker would serve cached assets and silently
    // bypass the route interception below.
    serviceWorkers: 'block',
  })

  try {
    // Routing MUST be installed before the first navigation, otherwise
    // the preview's boot-time API calls escape to the real backend.
    await installRouting(context, scenario, blocked, fulfilled, origin)
    // Same "today" for every capture (current and baseline): see FIXED_NOW.
    await context.clock.setFixedTime(new Date(scenario.now ?? FIXED_NOW))

    const page = await context.newPage()
    const previewErrors: string[] = []
    page.on('pageerror', (error) => previewErrors.push(error.message))
    await page.addInitScript(() => {
      // Belt-and-braces: prevent any registration attempt at runtime.
      if ('serviceWorker' in navigator) {
        Object.defineProperty(navigator, 'serviceWorker', { get: () => undefined })
      }
    })

    await page.goto(`${origin}${PREVIEW_PATH}?scenario=${encodeURIComponent(scenario.id)}`, {
      waitUntil: 'domcontentloaded',
    })

    try {
      await page.waitForFunction(() => document.body.dataset.previewReady === 'true', null, {
        timeout: readyTimeout,
      })
    } catch (error) {
      // Preserve a genuine failed preview, rather than treating timeout as proof of absence.
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath.replace(/\.png$/, '.diagnostic.json'), JSON.stringify({
        previewErrors,
        body: await page.locator('body').innerText(),
        readiness: await page.locator('body').getAttribute('data-preview-ready'),
      }, null, 2))
      await page.screenshot({ path: outPath.replace(/\.png$/, '.error.png'), fullPage: true })
      throw error
    }

    const previewError = await page.evaluate(() => {
      if (document.body.dataset.previewError !== 'true') return null
      return document.querySelector('[data-preview-error]')?.textContent ?? 'unknown error'
    })
    if (previewError) {
      // Defect-reproduction scenarios: the documented production error is the evidence, so the
      // genuine error state is captured and the scenario's renderChecks then fail on it. Any other
      // error (or the same scenario once the defect is fixed) behaves as usual.
      const expected = scenario.expectedRenderError
      if (expected && previewError.includes(expected)) {
        await page.screenshot({ path: outPath, fullPage: true, animations: 'disabled', caret: 'hide' })
        if (inspect) await inspect(page)
        return
      }
      throw new Error(`Preview reported an error state:\n${previewError}`)
    }

    for (const action of scenario.actions ?? []) {
      if (action.type === 'wait') {
        await page.waitForTimeout(action.ms ?? 250)
        continue
      }
      if (action.type === 'reload') {
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => document.body.dataset.previewReady === 'true', null, {
          timeout: readyTimeout,
        })
        continue
      }
      if (action.type === 'expect-local-storage') {
        if (!action.key) {
          throw new Error('Action "expect-local-storage" is missing a key.')
        }
        const storedValue = await page.evaluate((key) => localStorage.getItem(key), action.key)
        expect(storedValue).toContain(action.value ?? '')
        continue
      }
      if (!action.selector) {
        throw new Error(`Action "${action.type}" is missing a selector.`)
      }
      if (action.type === 'expect-count') {
        await expect(page.locator(action.selector)).toHaveCount(action.count ?? 0)
        continue
      }
      const target = page.locator(action.selector).first()
      await expect(target).toBeVisible()
      if (action.type === 'scroll-right') await target.evaluate((el) => { el.scrollLeft = el.scrollWidth })
      if (action.type === 'hover') await target.hover()
      if (action.type === 'click') await target.click({ force: action.force })
      if (action.type === 'focus') await target.focus()
      if (action.type === 'press') await target.press(action.value ?? 'Enter')
      if (action.type === 'fill') await target.fill(action.value ?? '')
      if (action.type === 'expect-text') await expect(target).toContainText(action.value ?? '')
      if (action.type === 'expect-value') await expect(target).toHaveValue(action.value ?? '')
    }

        const element = page.locator(scenario.captureSelector).first()
        await expect(element).toBeVisible()
        // Component data and action-driven overlays can introduce fonts after previewReady.
        await page.evaluate(async () => { await document.fonts.ready })

    await element.screenshot({
      path: outPath,
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
    })
    if (inspect) await inspect(page)
  } finally {
    await context.close()
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * A baseline is absent only when the overlay's explicit missing-import
 * sentinel proves that a required source file does not exist at the base.
 */
function isAbsentAtBase(message: string): boolean {
  return message.includes('[visual-absent-at-base]')
}

/** Most informative single line of a (possibly multi-line) error. */
function keyLine(message: string | null): string {
  const lines = String(message ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    lines.find((l) => l.includes('[visual-absent-at-base]')) ??
    lines.find((l) => !/^Preview (reported an error state|bootstrap failed):?$/.test(l)) ??
    lines[0] ??
    'no error recorded'
  )
}

function relativeComparison(runDir: string, c: ComparisonResult): ComparisonResult {
  return {
    ...c,
    diffImage: c.diffImage ? path.relative(runDir, c.diffImage) : null,
    sideBySideImage: c.sideBySideImage ? path.relative(runDir, c.sideBySideImage) : null,
  }
}

const filter = scenarioFilter()
const selected = filter ? allScenarios.filter((s) => filter.includes(s.id)) : allScenarios

test.describe('visual check', () => {
  for (const scenario of selected) {
    test(`${scenario.id} — ${scenario.label}`, async ({ browser }) => {
      const runDir = currentRunDir()
      const attempt = currentAttempt()
      const attemptName = attemptDirName(attempt)
      const actualDir = path.join(runDir, 'actual', attemptName)
      const comparisonDir = path.join(runDir, 'comparison', attemptName)
      const referencePath = path.join(runDir, 'reference', `${scenario.id}.png`)
      const specPath = path.join(runDir, 'reference', `${scenario.id}.figma.json`)
      const baselineSpecPath = path.join(runDir, 'baseline', `${scenario.id}.spec-check.json`)
      const baselinePath = path.join(runDir, 'baseline', `${scenario.id}.png`)
      const absentMarker = path.join(runDir, 'baseline', `${scenario.id}.absent.json`)

      const blocked: BlockedRequest[] = []
      const fulfilled: string[] = []

      const result: ScenarioResult = {
        id: scenario.id,
        label: scenario.label,
        componentPath: scenario.componentPath,
        status: 'blocked',
        attempt,
        previewUrl: `${PREVIEW_PATH}?scenario=${encodeURIComponent(scenario.id)}`,
        viewport: scenario.viewport,
        theme: scenario.theme,
        locale: scenario.locale,
        captureSelector: scenario.captureSelector,
        actualImage: null,
        referenceImage: null,
        referenceNote: scenario.referenceNote ?? null,
        device: scenario.device ?? deviceFromWidth(scenario.viewport.width),
        deviceDerived: scenario.device === undefined,
        figmaNode: scenario.figmaNode ?? null,
        state: scenario.state ?? null,
        responsiveFindings: null,
        comparison: null,
        findings: [],
        missingEvidence: [],
        blockedRequests: blocked,
        fulfilledMocks: fulfilled,
        error: null,
        baselineImage: null,
        baselineStatus: 'disabled',
        baselineError: null,
        baselineComparison: null,
        baselineVsReference: null,
        triptychImage: null,
        figmaSpec: null,
        figmaSpecError: null,
        specComparison: null,
        baselineSpecComparison: null,
      }

      const actualPath = path.join(actualDir, `${scenario.id}.png`)

      let spec: FigmaSpec | null = null
      if (fs.existsSync(specPath)) {
        const loaded = loadSpec(specPath)
        spec = loaded.spec
        result.figmaSpec = loaded.spec
        result.figmaSpecError = loaded.error
        if (loaded.error) {
          result.missingEvidence.push({
            item: `reference/${scenario.id}.figma.json`,
            reason: `Figma spec is invalid and was not checked — ${loaded.error}`,
          })
        }
      }
      const responsiveLines: string[] = []
      const sectionCaptures = new Map<string, SectionCapture>()
      const sectionCaptureErrors = new Map<string, string>()
      const sectionProblems = validateSections(scenario)
      const hasSections = (scenario.sections?.length ?? 0) > 0
      const inspectFor = (sink: { snapshot: ComputedSnapshot | null }, measureResponsive = false) =>
        spec || (measureResponsive && (scenario.responsiveCheck || hasSections || scenario.renderChecks?.length))
          ? async (page: Page) => {
              if (spec) sink.snapshot = await collectComputed(page, scenario.captureSelector, spec)
              if (measureResponsive && scenario.renderChecks?.length) {
                const checks = []
                for (const check of scenario.renderChecks) {
                  const locator = page.locator(check.selector)
                  const count = await locator.count()
                  // `innerText` only exists on HTMLElement: an `<svg>` match (Lucide icons) threw
                  // "Node is not an HTMLElement" and aborted the capture. Fall back to textContent.
                  const text = count
                    ? (await locator.first().evaluate((el) => (el instanceof HTMLElement ? el.innerText : el.textContent) ?? ''))
                        .replace(/\s+/g, ' ')
                        .trim()
                    : null
                  const value = count && check.value !== undefined ? await locator.first().inputValue() : null
                  // Rendered box of the first match (CSS px), recorded as evidence for size checks
                  // such as "the icon svg is 16×16" without needing a Figma spec.
                  const firstBox = count ? await locator.first().boundingBox() : null
                  const box = firstBox
                    ? { x: Math.round(firstBox.x * 100) / 100, y: Math.round(firstBox.y * 100) / 100, width: Math.round(firstBox.width * 100) / 100, height: Math.round(firstBox.height * 100) / 100 }
                    : null
                  const passed = (check.count === undefined || count === check.count)
                    && (check.text === undefined || (text ?? '').includes(check.text))
                    && (check.value === undefined || value === check.value)
                  checks.push({ ...check, observed: { count, text, value, box }, status: passed ? 'pass' : 'fail' })
                  if (!passed) responsiveLines.push(`Requirement failed: ${check.label} (${check.selector})`)
                }
                fs.mkdirSync(comparisonDir, { recursive: true })
                fs.writeFileSync(path.join(comparisonDir, `${scenario.id}.requirements.json`),
                  JSON.stringify({ scenario: scenario.id, checks }, null, 2))
              }
              if (measureResponsive && hasSections && !sectionProblems.length) {
                for (const section of scenario.sections ?? []) {
                  try {
                    sectionCaptures.set(
                      section.id,
                      await captureSection(page, section, path.join(actualDir, `${scenario.id}.${section.id}.png`)),
                    )
                  } catch (error) {
                    sectionCaptureErrors.set(section.id, errorText(error).split('\n')[0])
                  }
                }
              }
              if (measureResponsive && scenario.responsiveCheck) {
                const measured = await collectResponsive(page, scenario.captureSelector, scenario.responsiveCheck)
                fs.mkdirSync(comparisonDir, { recursive: true })
                fs.writeFileSync(
                  path.join(comparisonDir, `${scenario.id}.responsive.json`),
                  JSON.stringify(measured, null, 2),
                )
                responsiveLines.push(...responsiveFindings(measured))
              }
            }
          : undefined

      try {
        const current: { snapshot: ComputedSnapshot | null } = { snapshot: null }
        await captureScenario(
          browser, scenario, BASE_URL, actualPath, blocked, fulfilled, PREVIEW_READY_TIMEOUT,
          inspectFor(current, true),
        )
        result.actualImage = path.relative(runDir, actualPath)

        let pixelStatus: 'passed' | 'differences' | 'partial' | null = null
        if (fs.existsSync(referencePath)) {
          result.referenceImage = path.relative(runDir, referencePath)
          const comparison = compareImages(referencePath, actualPath, comparisonDir, scenario.id)
          result.comparison = relativeComparison(runDir, comparison)
          // With sections the whole-screen comparison is information: the frame height follows the content.
          if (!hasSections) {
            result.findings = comparison.findings
            pixelStatus = comparison.status === 'passed' ? 'passed' : 'differences'
          }
        } else {
          result.missingEvidence.push({
            item: `reference/${scenario.id}.png`,
            reason:
              (scenario.referenceNote ? `${scenario.referenceNote}. ` : '') +
              `No reference image supplied, so pixel parity could not be judged. Export the Figma ` +
              `frame at ${scenario.viewport.width}x${scenario.viewport.height} @` +
              `${scenario.viewport.deviceScaleFactor}x and save it as ` +
              `Src/CarStore.Web/ClientApp/visual/references/${scenario.id}.png.`,
          })
        }

        if (hasSections) {
          result.wholeScreenInformational = true
          for (const problem of sectionProblems) {
            result.findings.push(`Invalid sections: ${problem}`)
          }
          if (sectionProblems.length) throw new Error(`Invalid sections: ${sectionProblems.join('; ')}`)
          const sections: SectionResult[] = []
          for (const section of scenario.sections ?? []) {
            const sectionRef = path.join(runDir, 'reference', `${scenario.id}.${section.id}.png`)
            const capture = sectionCaptures.get(section.id) ?? null
            if (!capture) {
              const reason = sectionCaptureErrors.get(section.id) ?? 'the section was not captured'
              sections.push(blockedSection(section, runDir, reason, sectionRef, null))
              result.missingEvidence.push({ item: `actual/${attemptName}/${scenario.id}.${section.id}.png`, reason })
              continue
            }
            if (!fs.existsSync(sectionRef)) {
              const reason = `no Figma reference for the section; export node ${section.figmaNodeId} with get_screenshot to visual/references/${scenario.id}.${section.id}.png`
              sections.push(blockedSection(section, runDir, reason, sectionRef, capture))
              result.missingEvidence.push({ item: `reference/${scenario.id}.${section.id}.png`, reason })
              continue
            }
            sections.push(
              compareSection({
                section,
                runDir,
                referencePath: sectionRef,
                capture,
                outDir: comparisonDir,
                basename: `${scenario.id}.${section.id}`,
                deviceScaleFactor: scenario.viewport.deviceScaleFactor,
              }),
            )
          }
          result.sections = sections
          for (const sec of sections) result.findings.push(...sec.findings)
          if (sections.some((sec) => sec.outcome === 'fail')) pixelStatus = 'differences'
          else if (sections.some((sec) => sec.outcome === 'info' || sec.outcome === 'blocked')) pixelStatus = 'partial'
          else pixelStatus = 'passed'
        }

        let specStatus: 'passed' | 'differences' | null = null
        if (spec && current.snapshot) {
          result.specComparison = compareSpec(spec, current.snapshot)
          specStatus = result.specComparison.status
          const { failed, missing, total } = result.specComparison
          if (failed || missing) {
            result.findings.push(
              `Figma spec: ${failed} property mismatch(es) and ${missing} missing element(s) out of ${total} checks.`,
            )
          }
        } else if (!result.figmaSpecError) {
          result.missingEvidence.push({
            item: `reference/${scenario.id}.figma.json`,
            reason:
              'No Figma spec supplied, so layout, typography, color, token and text values were not checked. ' +
              'qa-agent builds it from the Figma MCP next to the PNG.',
          })
        }

        result.findings.push(...responsiveLines)
        if (scenario.responsiveCheck) result.responsiveFindings = responsiveLines.length

        if (pixelStatus === 'differences' || specStatus === 'differences') {
          result.status = 'differences'
        } else if (pixelStatus === 'passed' && specStatus === 'passed') {
          result.status = 'passed'
        } else if (pixelStatus || specStatus) {
          result.status = 'partial'
          result.findings.push(
            pixelStatus === 'partial'
              ? 'Partial Figma parity: at least one section is data-driven (information only) or blocked, so pixels are not fully proven.'
              : `Partial Figma parity: ${pixelStatus ? 'pixels' : 'spec'} passed, but no ${pixelStatus ? 'Figma spec' : 'reference PNG'} was available.`,
          )
        } else {
          result.status = 'not-applicable'
          result.findings.push(
            'Captured successfully, but marked not-applicable: there is nothing to compare against.',
          )
        }
      } catch (error) {
        result.status = 'blocked'
        result.error = errorText(error)
        result.findings.push(`Capture blocked: ${result.error.split('\n')[0]}`)
        if (!result.actualImage) {
          result.missingEvidence.push({
            item: `actual/${attemptName}/${scenario.id}.png`,
            reason: `Screenshot was never taken — ${result.error.split('\n')[0]}`,
          })
        }
      }

      // ── Baseline (previous version). Never fails the test. ──────────────
      try {
        let status: BaselineStatus = 'disabled'
        if (fs.existsSync(absentMarker)) {
          const marker = JSON.parse(fs.readFileSync(absentMarker, 'utf8')) as {
            attempt?: number
            error?: string
          }
          // Older harness versions labeled any bootstrap failure absent-at-base.
          // Preserve that evidence, but retry when it was not the explicit missing-source sentinel.
          if (!isAbsentAtBase(marker.error ?? '')) {
            const historyDir = path.join(runDir, 'baseline', 'history')
            fs.mkdirSync(historyDir, { recursive: true })
            const suffix = String(marker.attempt ?? 'unknown').padStart(2, '0')
            fs.renameSync(absentMarker, path.join(
              historyDir,
              `${scenario.id}.attempt-${suffix}.stale-absent-marker.json`,
            ))
          }
        }
        // A baseline is only reusable for the same capture geometry. When a correction round changes the
        // viewport, DPR, mount width, theme or capture root, the stored image cannot be compared with the
        // new capture: archive it (evidence is never deleted) and capture the base again.
        const baselineMetaPath = path.join(runDir, 'baseline', `${scenario.id}.capture.json`)
        const captureGeometry = {
          viewport: scenario.viewport,
          mountWidth: scenario.mountWidth ?? null,
          theme: scenario.theme,
          captureSelector: scenario.captureSelector,
        }
        if (BASELINE_ENABLED && fs.existsSync(baselinePath)) {
          const stored = fs.existsSync(baselineMetaPath)
            ? JSON.stringify(JSON.parse(fs.readFileSync(baselineMetaPath, 'utf8')).geometry ?? null)
            : null
          if (stored !== JSON.stringify(captureGeometry)) {
            const historyDir = path.join(runDir, 'baseline', 'history')
            fs.mkdirSync(historyDir, { recursive: true })
            const tag = `${scenario.id}.before-attempt-${String(attempt).padStart(2, '0')}`
            fs.renameSync(baselinePath, path.join(historyDir, `${tag}.png`))
            if (fs.existsSync(baselineSpecPath)) fs.renameSync(baselineSpecPath, path.join(historyDir, `${tag}.spec-check.json`))
            if (fs.existsSync(baselineMetaPath)) fs.renameSync(baselineMetaPath, path.join(historyDir, `${tag}.capture.json`))
          }
        }
        if (fs.existsSync(baselinePath)) {
          status = 'reused'
        } else if (fs.existsSync(absentMarker)) {
          status = 'absent-at-base'
          result.baselineError =
            (JSON.parse(fs.readFileSync(absentMarker, 'utf8')) as { error?: string }).error ?? null
        } else if (BASELINE_ENABLED) {
          fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
          let lastError: string | null = null
          // One retry: a cold optimizer cache can reload the page mid-boot.
          for (let tryNo = 1; tryNo <= 2; tryNo++) {
            try {
              const previous: { snapshot: ComputedSnapshot | null } = { snapshot: null }
              await captureScenario(
                browser,
                {
                  ...scenario,
                  actions: scenario.baselineActions ?? scenario.actions,
                },
                BASELINE_URL,
                baselinePath,
                [],
                [],
                BASELINE_READY_TIMEOUT,
                inspectFor(previous),
              )
              // Persisted so later attempts (or a refreshed spec) can re-check the base render.
              if (previous.snapshot) {
                writeJson(baselineSpecPath, {
                  selectors: spec?.checks.map((c) => c.selector) ?? [],
                  snapshot: previous.snapshot,
                })
              }
              lastError = null
              break
            } catch (error) {
              lastError = errorText(error)
              if (lastError.includes('[visual-absent-at-base]')) break
            }
          }
          if (lastError === null) {
            status = 'captured'
            writeJson(baselineMetaPath, { attempt, geometry: captureGeometry })
          } else {
            result.baselineError = lastError
            if (fs.existsSync(baselinePath)) fs.rmSync(baselinePath)
            if (isAbsentAtBase(lastError)) {
              status = 'absent-at-base'
              writeJson(absentMarker, { attempt, error: lastError })
            } else {
              status = 'blocked'
            }
          }
        }

        result.baselineStatus = status
        if (fs.existsSync(baselinePath)) {
          result.baselineImage = path.relative(runDir, baselinePath)
        } else if (status === 'absent-at-base' || status === 'blocked') {
          result.missingEvidence.push({
            item: `baseline/${scenario.id}.png`,
            reason:
              status === 'absent-at-base'
                ? `The component or preview does not exist or never became ready at the base commit — ${keyLine(result.baselineError)}`
                : `Baseline capture failed — ${keyLine(result.baselineError)}`,
          })
        }

        if (spec && result.baselineImage && fs.existsSync(baselineSpecPath)) {
          const stored = JSON.parse(fs.readFileSync(baselineSpecPath, 'utf8')) as {
            selectors: string[]
            snapshot: ComputedSnapshot
          }
          // A snapshot taken for other selectors cannot be re-used against this spec.
          if (JSON.stringify(stored.selectors) === JSON.stringify(spec.checks.map((c) => c.selector))) {
            result.baselineSpecComparison = compareSpec(spec, stored.snapshot)
          }
        }

        const hasActual = fs.existsSync(actualPath) && result.actualImage !== null
        const hasBaseline = result.baselineImage !== null
        const hasReference = result.referenceImage !== null

        if (hasBaseline && hasActual) {
          result.baselineComparison = relativeComparison(
            runDir,
            compareImages(baselinePath, actualPath, comparisonDir, `${scenario.id}.baseline`),
          )
        }
        if (hasBaseline && hasReference) {
          result.baselineVsReference = relativeComparison(
            runDir,
            compareImages(referencePath, baselinePath, comparisonDir, `${scenario.id}.baseline-vs-reference`),
          )
        }
        // Only when it shows at least two panes; a lone current pane adds nothing.
        if (hasActual && (hasBaseline || (status !== 'disabled' && hasReference))) {
          const triptychPath = path.join(comparisonDir, `${scenario.id}.triptych.png`)
          writeTriptych(
            hasBaseline ? baselinePath : null,
            actualPath,
            hasReference ? referencePath : null,
            triptychPath,
          )
          result.triptychImage = path.relative(runDir, triptychPath)
        }
      } catch (error) {
        // Baseline bookkeeping must never mask the current capture's outcome.
        result.baselineStatus = 'blocked'
        result.baselineError = errorText(error)
      }

      writeJson(path.join(runDir, '.results', `${scenario.id}.json`), result)

      // Surface the outcome in the Playwright run itself, but only a hard
      // capture failure fails the test — differences are a review finding.
      expect(result.error, result.error ?? undefined).toBeNull()
    })
  }
})
