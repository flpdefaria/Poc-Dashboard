import { defineConfig, devices } from '@playwright/test'

import { previewWebServer } from '../playwright.config'
import { BASE_URL } from './lib/config'

/**
 * `npm run visual:measure` only: opens scenarios through the same path as the capture and runs a
 * probe. No globalSetup/teardown, so it never creates or touches a qa-results bundle.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /measure\.probe\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['line']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL: BASE_URL, actionTimeout: 15_000, screenshot: 'off', video: 'off', trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: previewWebServer,
})
