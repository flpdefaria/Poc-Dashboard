/**
 * EXAMPLE scenario file: replace it with the project's own screens.
 *
 * It points at `src/App.vue` only so the harness type-checks and runs on a
 * fresh install. Real scenarios import the page/dialog component under test,
 * declare every API call in `mocks`, wait for the real state with `actions`,
 * and assert the text requirements with `renderChecks`.
 */
import type { VisualScenario } from '../types'
import { DESKTOP, jsonMock, pageWidth } from './fixtures'

type Theme = 'light' | 'dark'

function examplePage(theme: Theme): VisualScenario {
  return {
    id: `example-page-${theme}`,
    label: `Example page, ${theme}, desktop`,
    // ADAPT: repo-relative path + lazy import of the REAL component under test.
    componentPath: 'src/App.vue',
    component: () => import('../../src/App.vue'),
    route: { path: '/' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    // The component's own root; screenshots are element screenshots, never the full page.
    captureSelector: '#preview-root > *',
    // Every API call the component makes. Undeclared calls are aborted and reported.
    mocks: [jsonMock('/api/example', [])],
    actions: [],
    renderChecks: [
      // { label: 'Page title', selector: 'h1', text: 'Orders' },
      // { label: 'First page has 10 rows', selector: '.p-datatable-tbody > tr', count: 10 },
    ],
  }
}

/*
 * Figma-backed variant: same scenario at 1x (Figma exports at 1x) with the reference
 * files `references/<id>.png` + `references/<id>.figma.json` (written by qa-agent from
 * the Figma MCP). `figmaNode` makes the Figma evidence REQUIRED for PASS.
 *
 * function examplePageFigma(theme: Theme): VisualScenario {
 *   return {
 *     ...examplePage(theme),
 *     id: `example-page-figma-${theme}`,
 *     viewport: DESKTOP_1X,
 *     mountWidth: 1440,
 *     ...(theme === 'light'
 *       ? { figmaNode: { nodeId: '12:345', url: 'https://www.figma.com/design/<fileKey>/<name>?node-id=12-345' } }
 *       : { referenceNote: 'Figma covers light only; dark is judged against the tokens' }),
 *   }
 * }
 */

export default [examplePage('light'), examplePage('dark')]
