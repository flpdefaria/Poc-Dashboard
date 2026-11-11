import type { ScenarioAction, VisualScenario } from '../types'
import { DESKTOP, brandOptions, cars, jsonMock, pageWidth, pagedMock } from './fixtures'

/**
 * Cars search box ("Buscar nesta página…", DataTableCommon): filters the loaded page only, case-insensitive,
 * across every column (pagination is server-side). No Figma frame draws a search state, so these are
 * requirement checks (renderChecks) plus visual review. Data = the same Figma first page as cars-figma.ts.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')

const figmaCars = cars
  .filter((car) => car.model !== 'Corolla')
  .map((car) => (car.model === '3 Series' ? { ...car, description: 'Sedã executivo compacto.' } : car))

const SEARCH = '.p-iconfield input[placeholder="Buscar nesta página…"]'
const DATA_ROWS = '.p-datatable-tbody > tr:not(.p-datatable-empty-message)'
const waitRows: ScenarioAction = { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }

function search(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
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
    state: id.replace(/^cars-/, '').replace(/-/g, ' '),
    referenceNote: 'Estado de busca sem frame Figma; revisado por requisitos e visualmente.',
    mocks: [pagedMock('/api/cars', figmaCars, 10), jsonMock('/api/brands/options', brandOptions)],
    ...extra,
  } as VisualScenario
}

function searchMatch(theme: Theme): VisualScenario {
  return search(theme, 'cars-search', 'Carros — busca "HONDA" filtra a página atual (sem diferenciar maiúsculas)', {
    actions: [
      waitRows,
      { type: 'fill', selector: SEARCH, value: 'HONDA' },
      { type: 'expect-count', selector: DATA_ROWS, count: 3 },
      { type: 'hover', selector: 'h1' },
      { type: 'wait', ms: 600 },
    ],
    baselineActions: [waitRows, { type: 'fill', selector: SEARCH, value: 'HONDA' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Busca mantém o termo', selector: SEARCH, value: 'HONDA' },
      { label: 'Só as 3 linhas Honda da página', selector: DATA_ROWS, count: 3 },
      { label: 'Linha 1 = Accord', selector: `${DATA_ROWS} >> nth=0`, text: 'Accord' },
      { label: 'Linha 2 = Civic', selector: `${DATA_ROWS} >> nth=1`, text: 'Civic' },
      { label: 'Linha 3 = CR-V', selector: `${DATA_ROWS} >> nth=2`, text: 'CR-V' },
      { label: 'Nenhuma linha de outra marca', selector: `${DATA_ROWS}:has-text("Toyota")`, count: 0 },
      { label: 'Paginador continua presente (busca não pagina)', selector: '.p-paginator', count: 1 },
    ],
  })
}

function searchEmpty(theme: Theme): VisualScenario {
  return search(theme, 'cars-search-empty', 'Carros — busca sem resultado na página atual', {
    actions: [
      waitRows,
      { type: 'fill', selector: SEARCH, value: 'zzz-sem-resultado' },
      { type: 'expect-count', selector: DATA_ROWS, count: 0 },
      { type: 'hover', selector: 'h1' },
      { type: 'wait', ms: 600 },
    ],
    baselineActions: [waitRows, { type: 'fill', selector: SEARCH, value: 'zzz-sem-resultado' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Busca mantém o termo', selector: SEARCH, value: 'zzz-sem-resultado' },
      { label: 'Nenhuma linha de dados', selector: DATA_ROWS, count: 0 },
      { label: 'Linha de vazio do DataTable', selector: '.p-datatable-empty-message', count: 1 },
    ],
  })
}

const both = (fn: (t: Theme) => VisualScenario) => [fn('light'), fn('dark')]

export default [...both(searchMatch), ...both(searchEmpty)]
