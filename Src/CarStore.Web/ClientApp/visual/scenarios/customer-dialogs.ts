import type { VisualScenario } from '../types'
import { DESKTOP, customers, jsonMock, pageWidth, pagedMock } from './fixtures'
import carOptionsJson from './fixtures/car-options.json' with { type: 'json' }
import type { CarOption } from '../../src/types'

/**
 * "Carro" field of the customer dialogs (`CreateCustomerDialog.vue`, `EditCustomerDialog.vue`): a Select over
 * `GET /api/cars/options` (snapshot in `fixtures/car-options.json`), filterable and clearable ("Sem carro").
 * Dialogs and the Select panel are teleported to <body>, so the captures are full-viewport `body` shots.
 */
const carOptions = carOptionsJson as CarOption[]
const themeLabel = (theme: 'light' | 'dark') => (theme === 'light' ? 'claro' : 'escuro')

function base(theme: 'light' | 'dark') {
  return {
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop' as const,
    captureSelector: 'body',
    mocks: [pagedMock('/api/customers', customers, 10), jsonMock('/api/cars/options', carOptions)],
  }
}

/** New customer: the Select is open and filtered by "toy". */
function createWithCarFilter(theme: 'light' | 'dark'): VisualScenario {
  return {
    ...base(theme),
    id: `customer-create-car-select-${theme}`,
    label: `Clientes — Novo cliente, campo Carro aberto e filtrado, ${themeLabel(theme)}`,
    state: 'novo cliente · carro',
    actions: [
      { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 },
      { type: 'click', selector: 'button:has-text("Novo cliente")' },
      { type: 'expect-text', selector: '.p-dialog', value: 'Carro' },
      { type: 'expect-text', selector: '.p-dialog .p-select', value: 'Sem carro' },
      { type: 'click', selector: '.p-dialog .p-select' },
      { type: 'fill', selector: '.p-select-overlay input', value: 'toy' },
      { type: 'expect-count', selector: '.p-select-overlay .p-select-option', count: 7 },
      { type: 'wait', ms: 200 },
    ],
    // The base commit has no "Carro" field: just open the dialog for the before/after comparison.
    baselineActions: [
      { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 },
      { type: 'click', selector: 'button:has-text("Novo cliente")' },
      { type: 'expect-text', selector: '.p-dialog', value: 'Novo cliente' },
      { type: 'wait', ms: 200 },
    ],
    renderChecks: [
      { label: 'Diálogo Novo cliente aberto', selector: '.p-dialog', text: 'Novo cliente' },
      { label: 'Campo Carro presente', selector: '.p-dialog label:has-text("Carro")', count: 1 },
      { label: 'Filtro "toy" deixa os 7 Toyota', selector: '.p-select-overlay .p-select-option', count: 7 },
      { label: 'Primeira opção filtrada', selector: '.p-select-overlay .p-select-option >> nth=0', text: 'Toyota' },
    ],
  }
}

/** Edit Alice Johnson: the Select shows her current car (seed: Toyota Corolla) and can be cleared. */
function editWithCar(theme: 'light' | 'dark'): VisualScenario {
  return {
    ...base(theme),
    id: `customer-edit-car-${theme}`,
    label: `Clientes — Editar cliente com carro vinculado, ${themeLabel(theme)}`,
    state: 'editar cliente · carro',
    actions: [
      { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 },
      { type: 'click', selector: '.p-datatable-tbody > tr:first-child button[aria-label="Ações da linha"]' },
      { type: 'click', selector: '.p-menu-item:has-text("Editar")' },
      { type: 'expect-text', selector: '.p-dialog', value: 'Editar cliente' },
      { type: 'expect-text', selector: '.p-dialog .p-select', value: 'Toyota Corolla' },
      { type: 'wait', ms: 200 },
    ],
    baselineActions: [
      { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 },
      { type: 'click', selector: '.p-datatable-tbody > tr:first-child button[aria-label="Ações da linha"]' },
      { type: 'click', selector: '.p-menu-item:has-text("Editar")' },
      { type: 'expect-text', selector: '.p-dialog', value: 'Editar cliente' },
      { type: 'wait', ms: 200 },
    ],
    renderChecks: [
      { label: 'Diálogo Editar cliente aberto', selector: '.p-dialog', text: 'Editar cliente' },
      { label: 'Carro atual pré-selecionado', selector: '.p-dialog .p-select-label', text: 'Toyota Corolla' },
      { label: 'Botão de limpar o carro', selector: '.p-dialog .p-select-clear-icon', count: 1 },
    ],
  }
}

export default [
  createWithCarFilter('light'),
  createWithCarFilter('dark'),
  editWithCar('light'),
  editWithCar('dark'),
]
