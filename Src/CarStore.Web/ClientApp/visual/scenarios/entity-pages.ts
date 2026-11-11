import type { VisualScenario } from '../types'
import { DESKTOP, brandOptions, cars, customers, jsonMock, pageWidth, pagedMock } from './fixtures'

const themeLabel = (theme: 'light' | 'dark') => (theme === 'light' ? 'claro' : 'escuro')

/** `/cars`: `CarsPage.vue` loads page 1 (10 rows) and the brand options for the create dialog. */
function carsPage(theme: 'light' | 'dark'): VisualScenario {
  return {
    id: `cars-page-${theme}`,
    label: `Carros — tabela paginada, ${themeLabel(theme)}, desktop`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CarsPage.vue',
    component: () => import('../../src/components/CarsPage.vue'),
    route: { path: '/cars' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/cars', cars, 10), jsonMock('/api/brands/options', brandOptions)],
    actions: [{ type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Carros' },
      { label: 'Botão de criação', selector: 'button:has-text("Novo carro")', count: 1 },
      { label: 'Primeira página com 10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
    ],
  }
}

/** `/customers`: `CustomersPage.vue` loads page 1 (10 rows). */
function customersPage(theme: 'light' | 'dark'): VisualScenario {
  return {
    id: `customers-page-${theme}`,
    label: `Clientes — tabela paginada, ${themeLabel(theme)}, desktop`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/customers', customers, 10)],
    actions: [{ type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Clientes' },
      { label: 'Botão de criação', selector: 'button:has-text("Novo cliente")', count: 1 },
      { label: 'Primeiro cliente do seed', selector: '.p-datatable-tbody > tr', text: 'Alice Johnson' },
    ],
  }
}

/** Other state: the customers list with no rows (empty API page). */
function customersEmpty(theme: 'light' | 'dark'): VisualScenario {
  return {
    ...customersPage(theme),
    id: `customers-page-empty-${theme}`,
    label: `Clientes — lista vazia, ${themeLabel(theme)}, desktop`,
    state: 'vazio',
    mocks: [pagedMock('/api/customers', [], 10)],
    actions: [],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Clientes' },
      { label: 'Nenhuma linha de dados', selector: '.p-datatable-tbody > tr:not(.p-datatable-empty-message)', count: 0 },
    ],
  }
}

export default [
  carsPage('light'),
  carsPage('dark'),
  customersPage('light'),
  customersPage('dark'),
  customersEmpty('light'),
  customersEmpty('dark'),
]
