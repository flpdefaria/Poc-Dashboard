import type { VisualScenario } from '../types'
import { DESKTOP, customers, jsonMock, pageWidth, pagedMock } from './fixtures'
import carOptionsJson from './fixtures/car-options.json' with { type: 'json' }

/**
 * Guards for the non-card DataTableCommon path (Customers; Brands moved to card mode, see `brands-figma.ts`): one row checked, so the checked
 * checkbox, the selected-row fill and the active paginator page are captured and compared with the base.
 * The Figma selection blue (`.dt-card`, `bg-selected`) belongs to Cars card mode only and must not leak here.
 * No Figma frame: no `figmaNode`; the baseline triptych is the evidence.
 */
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')

const selectFirstRow = [
  { type: 'expect-count' as const, selector: '.p-datatable-tbody > tr', count: 10 },
  { type: 'click' as const, selector: '.p-datatable-tbody > tr:nth-child(1) .p-checkbox' },
  { type: 'expect-count' as const, selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 1 },
  { type: 'hover' as const, selector: 'h1' },
  { type: 'wait' as const, ms: 600 },
]

const commonChecks = [
  { label: 'Uma linha selecionada', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 1 },
  { label: 'Sem modo card (dt-card ausente)', selector: '.dt-card', count: 0 },
  { label: 'Página ativa 1', selector: '.p-paginator-page-selected', text: '1' },
]

function customersSelected(theme: Theme): VisualScenario {
  return {
    id: `customers-row-selected-${theme}`,
    label: `Clientes — linha selecionada (guarda de seleção), ${themeLabel(theme)}, desktop`,
    state: 'linha selecionada',
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/customers', customers, 10), jsonMock('/api/cars/options', carOptionsJson)],
    actions: selectFirstRow,
    renderChecks: [{ label: 'Título da página', selector: 'h1', text: 'Clientes' }, ...commonChecks],
  }
}

export default [customersSelected('light'), customersSelected('dark')]
