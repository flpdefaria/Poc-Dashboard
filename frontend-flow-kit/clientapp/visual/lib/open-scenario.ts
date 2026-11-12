/**
 * Open one scenario exactly as the capture does: isolated context, API mocks, pinned clock, preview
 * readiness, render-error check and the scenario's `actions`. Shared by `capture.spec.ts` (screenshots)
 * and `measure.probe.ts` (`npm run visual:measure`), so a measurement always sees the captured state.
 */
import { expect, type Browser, type BrowserContext, type Page, type Route } from '@playwright/test'

import type { ScenarioMock, VisualScenario } from '../types'
import { API_BASE_PATH, FIXED_NOW, PREVIEW_PATH, TIMEZONE_ID } from './config'
import type { BlockedRequest } from './report-types'

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

async function runActions(page: Page, scenario: VisualScenario, readyTimeout: number): Promise<void> {
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
}

export interface OpenedScenario {
  context: BrowserContext
  page: Page
  previewErrors: string[]
  /** Set when the preview shows the scenario's `expectedRenderError`; actions were not run. */
  renderError: string | null
}

/**
 * The caller owns `context` and must close it. On failure the context is closed before rethrowing;
 * `onNotReady` runs first when the preview never reports ready (diagnostics).
 */
export async function openScenario(
  browser: Browser,
  scenario: VisualScenario,
  origin: string,
  blocked: BlockedRequest[],
  fulfilled: string[],
  readyTimeout: number,
  onNotReady?: (page: Page, previewErrors: string[]) => Promise<void>,
): Promise<OpenedScenario> {
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
      if (onNotReady) await onNotReady(page, previewErrors)
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
        return { context, page, previewErrors, renderError: previewError }
      }
      throw new Error(`Preview reported an error state:\n${previewError}`)
    }

    await runActions(page, scenario, readyTimeout)
    return { context, page, previewErrors, renderError: null }
  } catch (error) {
    await context.close()
    throw error
  }
}
