import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import {
  BASE_URL,
  BASELINE_ENABLED,
  BASELINE_PORT,
  BASELINE_URL,
  DEV_PORT,
  TIMEZONE_ID,
  LOCALE_HINT,
  DEFAULT_DEVICE_SCALE_FACTOR,
  baselineDir,
  PREVIEW_PATH,
} from './visual/lib/config'
import { CLIENT_APP_REL } from './visual/lib/baseline'

type WebServer = NonNullable<Parameters<typeof defineConfig>[0]['webServer']>
type WebServerEntry = Exclude<WebServer, unknown[]>


const webServers: WebServerEntry[] = [
  {
    command: `npm run dev -- --config visual/vite.config.ts --port ${DEV_PORT} --strictPort`,
    // ClientApp has no index.html, so "/" is a 404: probe the preview entry instead.
    url: `${BASE_URL}${PREVIEW_PATH}`,
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { PORT: String(DEV_PORT) },
  },
]

const worktree = baselineDir()
if (BASELINE_ENABLED && worktree) {
  // The base commit's own dev server, with the current harness overlaid.
  // Never reused: an unrelated server on 5174 would silently answer with the
  // wrong code.
  webServers.push({
    command: `npm run dev -- --config visual/vite.config.ts --port ${BASELINE_PORT} --strictPort`,
    cwd: path.join(worktree, ...CLIENT_APP_REL),
    url: `${BASELINE_URL}${PREVIEW_PATH}`,
    reuseExistingServer: false,
    ignoreHTTPSErrors: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      PORT: String(BASELINE_PORT),
      VISUAL_BASELINE_SERVER: '1',
      ...(process.env.VISUAL_BASELINE_VITE_CACHE
        ? { VISUAL_VITE_CACHE_DIR: process.env.VISUAL_BASELINE_VITE_CACHE }
        : {}),
    },
  })
}

/**
 * Visual-check harness config. Chromium only: the bundle is a design-parity
 * review, not a cross-browser matrix, and a second engine would make every
 * reference image ambiguous.
 */
export default defineConfig({
  testDir: './visual',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './visual/lib/global-setup.ts',
  globalTeardown: './visual/lib/global-teardown.ts',
  // A baseline capture adds a second page load (and a cold optimizer cache).
  timeout: BASELINE_ENABLED ? 180_000 : 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    timezoneId: TIMEZONE_ID,
    locale: LOCALE_HINT,
    colorScheme: 'light',
    // Kill CSS/JS motion so a capture never races a transition.
    reducedMotion: 'reduce',
    deviceScaleFactor: DEFAULT_DEVICE_SCALE_FACTOR,
    // Screenshots are taken explicitly by the spec with
    // `animations: 'disabled'`; Playwright's automatic ones stay off.
    screenshot: 'off',
    video: 'off',
    trace: 'off',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: DEFAULT_DEVICE_SCALE_FACTOR,
      },
    },
  ],
  webServer: webServers.length === 1 ? webServers[0] : webServers,
})
