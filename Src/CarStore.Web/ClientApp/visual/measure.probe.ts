/**
 * Runner behind `npm run visual:measure` (see run-measure.mjs). For each scenario id it opens the
 * scenario exactly like the capture (mocks, clock, theme, viewport, actions) and runs the probe module's
 * default export `(page, scenario) => result`. Results are merged into VISUAL_MEASURE_OUT as
 * `{ [scenarioId]: { result, blockedRequests } }`.
 */
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { test, type Page } from '@playwright/test'

import { scenarios } from './scenarios'
import type { VisualScenario } from './types'
import { BASE_URL } from './lib/config'
import { openScenario } from './lib/open-scenario'
import type { BlockedRequest } from './lib/report-types'

type Probe = (page: Page, scenario: VisualScenario) => Promise<unknown>

const ids = (process.env.VISUAL_MEASURE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const probePath = process.env.VISUAL_MEASURE_PROBE ?? ''
const outPath = process.env.VISUAL_MEASURE_OUT ?? ''

for (const id of ids) {
  test(`measure ${id}`, async ({ browser }) => {
    const scenario = scenarios.find((s) => s.id === id)
    if (!scenario) throw new Error(`Unknown scenario id: ${id}`)
    const probe = (await import(pathToFileURL(probePath).href)).default as Probe
    const blocked: BlockedRequest[] = []
    const { context, page } = await openScenario(browser, scenario, BASE_URL, blocked, [], 30_000)
    try {
      await page.evaluate(async () => { await document.fonts.ready })
      const result = await probe(page, scenario)
      const all = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {}
      all[id] = { result, blockedRequests: blocked }
      fs.writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')
    } finally {
      await context.close()
    }
  })
}
