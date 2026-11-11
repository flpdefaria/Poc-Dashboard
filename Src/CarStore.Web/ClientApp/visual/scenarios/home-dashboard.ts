import type { VisualScenario } from '../types'
import { DESKTOP, homeMocks, pageWidth } from './fixtures'

/**
 * Home dashboard ("Central da frota", Figma EOvtzuJAvw1UnoH9tsYmiO node 2005:5266) with the seeded
 * fleet, rendered at its production width inside a 1440px desktop (no sidebar shell).
 *
 * `Home.vue` plays the showroom loader on the first visit of the page session, and every preview
 * load is a first visit, so the capture waits for `.home-ready` (set when the loader leaves and the
 * reveal starts) before shooting. Reduced motion is on, so the tweened KPI numbers land instantly.
 */
function homeDashboard(theme: 'light' | 'dark'): VisualScenario {
  return {
    id: `home-dashboard-${theme}`,
    label: `Home — Central da frota, ${theme === 'light' ? 'claro' : 'escuro'}, desktop`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/Home.vue',
    component: () => import('../../src/components/Home.vue'),
    route: { path: '/' },
    routeNames: ['home', 'cars', 'brands', 'customers'],
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > .home-ready',
    mocks: homeMocks(),
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
    ],
    // No `figmaNode` on purpose: declaring one makes Figma evidence REQUIRED, and `visual:verdict`
    // blocks PASS until `references/<id>.png` + `.figma.json` exist. Add it when a task brings Figma.
    referenceNote:
      'Sem PNG de referência: o frame Figma 2005:5266 inclui a nav rail, e a captura é só a página. ' +
      'Exporte o nó da área de conteúdo em 2x para comparar pixels',
  }
}

export default [homeDashboard('light'), homeDashboard('dark')]
