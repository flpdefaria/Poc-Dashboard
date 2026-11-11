import type { ScenarioAction, VisualScenario } from '../types'
import { DESKTOP, brandOptions, brands, cars, customers, jsonMock, pageWidth, pagedMock } from './fixtures'
import carOptionsJson from './fixtures/car-options.json' with { type: 'json' }

/**
 * Cars second pass (2026-11-11): row actions menu open state and the card paginator
 * (Figma EOvtzuJAvw1UnoH9tsYmiO, frame 2069:2759 "Tela · Carros · Menu de ações aberto").
 *
 * `cars-row-menu-open` compares the whole content area with the menu open on row 2 ("5 Series", as drawn).
 * The other scenarios are states without a frame (closed again, selected + open, upward flip, page hover,
 * rows per page) and regression guards for the Brands/Customers row menus, which must not change.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }
const FIGMA_FILE = 'https://www.figma.com/design/EOvtzuJAvw1UnoH9tsYmiO/?node-id='
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')

const figmaCars = cars
  .filter((car) => car.model !== 'Corolla')
  .map((car) => (car.model === '3 Series' ? { ...car, description: 'Sedã executivo compacto.' } : car))

const waitRows = (count = 10): ScenarioAction => ({ type: 'expect-count', selector: '.p-datatable-tbody > tr', count })
const trigger = (row: number) => `.p-datatable-tbody > tr:nth-child(${row}) button[aria-label="Ações da linha"]`
// The pointer is moved to the page title after the click, so the capture shows the open state, not the row hover.
const openMenu = (row: number): ScenarioAction[] => [
  { type: 'click', selector: trigger(row) },
  { type: 'expect-count', selector: '.p-menu-overlay', count: 1 },
  { type: 'hover', selector: 'h1' },
  { type: 'wait', ms: 600 },
]

function cars2(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CarsPage.vue',
    component: () => import('../../src/components/CarsPage.vue'),
    route: { path: '/cars' },
    viewport: VIEWPORT,
    mountWidth: pageWidth(VIEWPORT.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/cars', figmaCars, 10), jsonMock('/api/brands/options', brandOptions)],
    ...extra,
  } as VisualScenario
}

function menuOpen(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-row-menu-open', 'Carros — menu aberto na linha 2 (linha e gatilho em estado aberto)', {
    ...(theme === 'light'
      ? { figmaNode: { nodeId: '2069:2759', name: 'Tela · Carros · Menu de ações aberto', url: `${FIGMA_FILE}2069-2759` } }
      : { referenceNote: 'O arquivo Figma só desenha o tema claro; o escuro é revisado visualmente.' }),
    actions: [waitRows(), ...openMenu(2)],
    baselineActions: [waitRows(), { type: 'click', selector: trigger(2) }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Menu aberto com 3 ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Gatilho da linha 2 com aria-expanded=true', selector: `${trigger(2)}[aria-expanded="true"]`, count: 1 },
      { label: 'Só um gatilho expandido', selector: 'button[aria-label="Ações da linha"][aria-expanded="true"]', count: 1 },
      { label: 'Linha aberta = 5 Series', selector: '.p-datatable-tbody > tr:nth-child(2)', text: '5 Series' },
    ],
  })
}

function menuClosed(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-row-menu-closed', 'Carros — menu fechado de novo (estado aberto limpo)', {
    state: 'menu fechado',
    referenceNote: 'Estado sem frame Figma: deve ficar igual à lista (cars-list).',
    actions: [waitRows(), ...openMenu(2), { type: 'click', selector: 'h1' }, { type: 'expect-count', selector: '.p-menu-overlay', count: 0 }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Menu fechado', selector: '.p-menu-overlay', count: 0 },
      { label: 'Nenhum gatilho expandido', selector: 'button[aria-label="Ações da linha"][aria-expanded="true"]', count: 0 },
      { label: 'Gatilhos com aria-expanded=false', selector: 'button[aria-label="Ações da linha"][aria-expanded="false"]', count: 10 },
    ],
  })
}

function menuSelectedOpen(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-row-menu-selected-open', 'Carros — menu aberto em linha selecionada (seleção domina)', {
    state: 'menu em linha selecionada',
    referenceNote: 'Estado sem frame Figma: regra do componente table-row (a seleção domina o hover).',
    actions: [waitRows(), { type: 'click', selector: '.p-datatable-tbody > tr:nth-child(2) .p-checkbox' }, ...openMenu(2)],
    renderChecks: [
      { label: 'Linha 2 selecionada', selector: '.p-datatable-tbody > tr:nth-child(2)[data-p-selected="true"]', count: 1 },
      { label: 'Gatilho expandido', selector: `${trigger(2)}[aria-expanded="true"]`, count: 1 },
    ],
  })
}

function menuFlip(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-row-menu-flip', 'Carros — menu da última linha abre para cima perto do fim da viewport', {
    state: 'menu invertido',
    referenceNote: 'Estado sem frame Figma: comportamento de posicionamento do popup.',
    // 760px: row 10's trigger ends at 656.5px, so 4 + 106px of menu below it would overflow and PrimeVue flips it.
    // The page (735px) still fits, so the element screenshot does not scroll (a scroll closes the popup).
    viewport: { width: 1440, height: 760, deviceScaleFactor: 1 },
    actions: [waitRows(), ...openMenu(10)],
    renderChecks: [
      { label: 'Menu aberto', selector: '.p-menu-overlay', count: 1 },
      { label: 'Gatilho da linha 10 expandido', selector: `${trigger(10)}[aria-expanded="true"]`, count: 1 },
    ],
  })
}

function pageHover(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-paginator-hover', 'Carros — hover na página 2 do paginador', {
    state: 'hover paginador',
    referenceNote: 'O Figma não desenha hover; requisito textual: fundo de hover só em páginas não ativas.',
    captureSelector: '.p-paginator',
    actions: [waitRows(), { type: 'hover', selector: '.p-paginator-page:text-is("2")' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Página ativa = 1', selector: '.p-paginator-page-selected', text: '1' },
      { label: 'Sem texto de relatório de página', selector: '.p-paginator-current', count: 0 },
      { label: '4 páginas', selector: '.p-paginator-page', count: 4 },
    ],
  })
}

function rowsPerPage(theme: Theme): VisualScenario {
  return cars2(theme, 'cars-rows-per-page', 'Carros — trocar linhas por página para 20', {
    state: 'linhas por página',
    referenceNote: 'Fluxo funcional sem frame Figma correspondente.',
    mocks: [pagedMock('/api/cars', figmaCars, 10), pagedMock('/api/cars', figmaCars, 20), jsonMock('/api/brands/options', brandOptions)],
    actions: [
      waitRows(),
      { type: 'click', selector: '.p-paginator .p-select' },
      { type: 'click', selector: '.p-select-overlay .p-select-option:has-text("20")' },
      waitRows(20),
      { type: 'wait', ms: 600 },
    ],
    renderChecks: [
      { label: '20 linhas', selector: '.p-datatable-tbody > tr', count: 20 },
      { label: 'Select mostra 20', selector: '.p-paginator .p-select-label', text: '20' },
      { label: '2 páginas', selector: '.p-paginator-page', count: 2 },
    ],
  })
}

// ---------------------------------------------------------------- Regression guards (must match HEAD)

function brandsMenu(theme: Theme): VisualScenario {
  return {
    id: `brands-row-menu-${theme}`,
    label: `Marcas — menu de ações da linha (regressão), ${themeLabel(theme)}`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/BrandsPage.vue',
    component: () => import('../../src/components/BrandsPage.vue'),
    route: { path: '/brands' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    state: 'menu marcas',
    referenceNote: 'Regressão: deve ser idêntico à base (HEAD).',
    captureSelector: '.p-menu-overlay',
    mocks: [pagedMock('/api/brands', brands, 10)],
    actions: [waitRows(), { type: 'click', selector: trigger(1) }, { type: 'expect-count', selector: '.p-menu-overlay', count: 1 }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Três ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Sem aria-expanded fora do modo card', selector: 'button[aria-label="Ações da linha"][aria-expanded]', count: 0 },
    ],
  }
}

function customersMenu(theme: Theme): VisualScenario {
  return {
    id: `customers-row-menu-${theme}`,
    label: `Clientes — menu de ações da linha (regressão), ${themeLabel(theme)}`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    state: 'menu clientes',
    referenceNote: 'Regressão: deve ser idêntico à base (HEAD).',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/customers', customers, 10), jsonMock('/api/cars/options', carOptionsJson)],
    actions: [waitRows(), { type: 'click', selector: trigger(3) }, { type: 'expect-count', selector: '.p-menu-overlay', count: 1 }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Três ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Sem aria-expanded fora do modo card', selector: 'button[aria-label="Ações da linha"][aria-expanded]', count: 0 },
    ],
  }
}

const both = (fn: (t: Theme) => VisualScenario) => [fn('light'), fn('dark')]

export default [
  ...both(menuOpen),
  ...both(menuClosed),
  ...both(menuSelectedOpen),
  ...both(menuFlip),
  ...both(pageHover),
  ...both(rowsPerPage),
  ...both(brandsMenu),
  ...both(customersMenu),
]
