import type { VisualScenario } from '../types'
import { DESKTOP, brands, cars, homeMocks, pageWidth } from './fixtures'
import { figmaCustomers } from './fixtures-figma'

/**
 * Home dashboard ("Central da frota", Figma EOvtzuJAvw1UnoH9tsYmiO frame 2005:5266), rendered at its
 * production width inside a 1440px desktop (no sidebar shell).
 *
 * `Home.vue` plays the showroom loader on the first visit of the page session, and every preview
 * load is a first visit, so the capture waits for `.home-ready` (set when the loader leaves and the
 * reveal starts) before shooting. Reduced motion is on, so the tweened KPI numbers land instantly.
 *
 * Figma parity (light): the frame was drawn at 1x, so both themes capture at DPR 1 and are compared
 * with `visual/references/home-dashboard-light.png` (the `main` node 2005:5301 cropped to its content
 * area, no nav rail, no 40px shell margin) without rescaling. The data is the prototype's own
 * (`fixtures-figma.ts` customers + the seeded cars/brands, which already yield the frame's KPIs and
 * brand shares), so the pixel diff measures layout and styling, not content.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }

function homeDashboard(theme: 'light' | 'dark'): VisualScenario {
  const light = theme === 'light'
  return {
    id: `home-dashboard-${theme}`,
    label: `Home — Central da frota, ${light ? 'claro' : 'escuro'}, desktop`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/Home.vue',
    component: () => import('../../src/components/Home.vue'),
    route: { path: '/' },
    routeNames: ['home', 'cars', 'brands', 'customers'],
    viewport: VIEWPORT,
    mountWidth: pageWidth(VIEWPORT.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > .home-ready',
    mocks: homeMocks({ cars, brands, customers: figmaCustomers }),
    actions: [
      { type: 'expect-count', selector: '.home-ready', count: 1 },
      // Reveal transitions (reduced to near-zero) and the ECharts first paint.
      { type: 'wait', ms: 800 },
    ],
    // The pre-change baseline may not have the `home-ready` hook; capture its settled page instead.
    baselineActions: [{ type: 'wait', ms: 3000 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Central da frota' },
      { label: 'Quatro cartões de KPI', selector: '.grid.xl\\:grid-cols-4 > .p-card', count: 4 },
      { label: 'Gráfico de novos clientes', selector: 'h2:text-is("Novos clientes")', count: 1 },
      { label: 'Ranking de frota por marca', selector: 'h2:text-is("Frota por marca")', count: 1 },
      { label: 'Tabela de clientes recentes com 5 linhas', selector: '.p-datatable-tbody > tr', count: 5 },
      { label: 'Coluna Carro na tabela', selector: '.p-datatable-thead th:nth-child(3)', text: 'Carro' },
      { label: 'Carro do primeiro cliente', selector: '.p-datatable-tbody > tr:first-child > td:nth-child(3)', text: 'Toyota Corolla XEi 2.0' },
    ],
    ...(light
      ? {
          // Figma evidence is REQUIRED for this scenario: `visual:verdict` blocks PASS without the PNG + spec.
          figmaNode: {
            nodeId: '2005:5266',
            name: 'Tela · Central da frota',
            url: 'https://www.figma.com/design/EOvtzuJAvw1UnoH9tsYmiO/?node-id=2005-5266',
          },
        }
      : {
          referenceNote: 'Sem frame escuro no Figma: o tema escuro é revisado por contraste e legibilidade, sem paridade de design',
        }),
  }
}

export default [homeDashboard('light'), homeDashboard('dark')]
