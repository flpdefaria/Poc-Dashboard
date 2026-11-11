import type { ScenarioAction, ScenarioMock, VisualScenario } from '../types'
import { DESKTOP, brandOptions, brands, cars, jsonMock, pageWidth, pagedMock } from './fixtures'

/**
 * Cars screen refactor (Figma EOvtzuJAvw1UnoH9tsYmiO, page 2079:3816): list 2063:4, row menu 2069:2759,
 * row selected 2070:1090, bulk delete 2071:1663, details 2073:3479, edit 2073:3806, new 2073:4133.
 *
 * The frames were drawn at 1x, so every Figma-compared scenario captures at DPR 1. Data = the prototype's
 * first page: the seed without "Corolla" (the frame lists Corolla Cross and CR-V as rows 9 and 10) and the
 * 3 Series description in Portuguese, as drawn in the details/edit frames. Total stays at 4 pages.
 *
 * Functional scenarios (CRUD round-trips, 400 messages, pagination) mock every write with method-agnostic
 * URL patterns: `/api/cars$` only matches the POST (the list GET has a query string) and
 * `/api/cars/<id>$` matches PUT/DELETE.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }
const FIGMA_FILE = 'https://www.figma.com/design/EOvtzuJAvw1UnoH9tsYmiO/?node-id='
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')

const figmaCars = cars
  .filter((car) => car.model !== 'Corolla')
  .map((car) => (car.model === '3 Series' ? { ...car, description: 'Sedã executivo compacto.' } : car))

const listMocks = (items = figmaCars): ScenarioMock[] => [
  pagedMock('/api/cars', items, 10),
  jsonMock('/api/brands/options', brandOptions),
]

const waitRows: ScenarioAction = { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }
const openRowMenu = (row = 1): ScenarioAction[] => [
  waitRows,
  { type: 'click', selector: `.p-datatable-tbody > tr:nth-child(${row}) button[aria-label="Ações da linha"]` },
  { type: 'expect-count', selector: '.p-menu-overlay', count: 1 },
]
const menuItem = (label: string): ScenarioAction => ({ type: 'click', selector: `.p-menu-overlay .p-menu-item:has-text("${label}")` })
const dialogOpen: ScenarioAction[] = [
  { type: 'expect-count', selector: '.p-dialog', count: 1 },
  { type: 'wait', ms: 300 },
]
const footerPrimary = '.p-dialog .p-dialog-footer button:last-child'

function base(theme: Theme, captureSelector: string) {
  return {
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CarsPage.vue',
    component: () => import('../../src/components/CarsPage.vue'),
    route: { path: '/cars' },
    viewport: VIEWPORT,
    mountWidth: pageWidth(VIEWPORT.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop' as const,
    captureSelector,
    mocks: listMocks(),
  }
}

function figma(theme: Theme, nodeId: string, name: string) {
  return theme === 'light'
    ? { figmaNode: { nodeId, name, url: `${FIGMA_FILE}${nodeId.replace(':', '-')}` } }
    : { referenceNote: 'O arquivo Figma só desenha o tema claro; o escuro é revisado visualmente.' }
}

// ---------------------------------------------------------------- Figma-compared states

function list(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figma(theme, '2063:4', 'Tela · Carros'),
    id: `cars-list-${theme}`,
    label: `Carros — lista (card), ${themeLabel(theme)}, desktop 1440`,
    actions: [waitRows, { type: 'wait', ms: 200 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Carros' },
      { label: 'Botão Novo carro', selector: 'button:has-text("Novo carro")', count: 1 },
      { label: 'Busca acima da tabela', selector: '.p-iconfield input[placeholder="Buscar nesta página…"]', count: 1 },
      { label: '10 linhas na primeira página', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: '9 colunas (seleção, 7 dados, ações)', selector: '.p-datatable-thead th', count: 9 },
      { label: 'Paginador com 4 páginas', selector: '.p-paginator-page', count: 4 },
    ],
  }
}

function rowMenu(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-menu-overlay'),
    ...figma(theme, '2069:2759', 'Tela · Carros · Menu de ações aberto'),
    id: `cars-row-menu-${theme}`,
    label: `Carros — menu de ações da linha, ${themeLabel(theme)}`,
    state: 'menu da linha',
    actions: [...openRowMenu(1), { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Três ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Ação Detalhes', selector: '.p-menu-overlay .p-menu-item >> nth=0', text: 'Detalhes' },
      { label: 'Ação Editar', selector: '.p-menu-overlay .p-menu-item >> nth=1', text: 'Editar' },
      { label: 'Ação Excluir', selector: '.p-menu-overlay .p-menu-item >> nth=2', text: 'Excluir' },
      { label: 'Ícones Lucide', selector: '.p-menu-overlay .p-menu-item svg.lucide', count: 3 },
    ],
  }
}

function rowSelected(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figma(theme, '2070:1090', 'Tela · Carros · Linha selecionada'),
    id: `cars-row-selected-${theme}`,
    label: `Carros — linha selecionada + exclusão em massa, ${themeLabel(theme)}`,
    state: 'linha selecionada',
    actions: [
      waitRows,
      { type: 'click', selector: '.p-datatable-tbody > tr:nth-child(1) .p-checkbox' },
      { type: 'expect-count', selector: 'button:has-text("Excluir selecionados")', count: 1 },
      { type: 'wait', ms: 200 },
    ],
    renderChecks: [
      { label: 'Uma linha selecionada', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 1 },
      { label: 'Botão de exclusão em massa com contagem', selector: 'button:has-text("Excluir selecionados")', text: 'Excluir selecionados (1)' },
    ],
  }
}

function bulkDeleteDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2071:1663', 'Tela · Carros · Confirmar exclusão'),
    id: `cars-bulk-delete-dialog-${theme}`,
    label: `Carros — confirmar exclusão de 10 carros, ${themeLabel(theme)}`,
    state: 'excluir em massa',
    actions: [
      waitRows,
      { type: 'click', selector: '.p-datatable-thead .p-checkbox' },
      { type: 'click', selector: 'button:has-text("Excluir selecionados")' },
      ...dialogOpen,
    ],
    renderChecks: [
      { label: 'Título com contagem', selector: '.p-dialog-header', text: 'Excluir 10 carros?' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Introdução no plural', selector: '.p-dialog-content', text: 'Os carros abaixo serão removidos do estoque:' },
      { label: 'Lista com os 10 carros', selector: '.p-dialog ul > li', count: 10 },
      { label: 'Primeira linha: modelo, marca · carroceria, preço', selector: '.p-dialog ul > li >> nth=0', text: '3 Series' },
      { label: 'Botão Excluir 10 carros', selector: footerPrimary, text: 'Excluir 10 carros' },
    ],
  }
}

function detailsDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2073:3479', 'Tela · Carros · Detalhes'),
    id: `cars-details-dialog-${theme}`,
    label: `Carros — detalhes do carro, ${themeLabel(theme)}`,
    state: 'detalhes',
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Título = modelo', selector: '.p-dialog-header', text: '3 Series' },
      { label: 'Tag Disponível', selector: '.p-dialog-header .p-tag', text: 'Disponível' },
      { label: 'Subtítulo marca · carroceria', selector: '.p-dialog-header', text: 'BMW · Sedan' },
      { label: 'Preço em destaque', selector: '.p-dialog-content p.text-\\[32px\\]', text: 'R$ 44.500,00' },
      { label: 'Caixa de estatísticas', selector: '.p-dialog-content > dl', text: '50 un.' },
      { label: 'Seção Especificações', selector: '.p-dialog-content h3:text-is("Especificações")', count: 1 },
      { label: 'VIN em monoespaçada', selector: '.p-dialog-content dd.font-mono', text: 'WBA5R1C0XLA123462' },
      { label: 'Botões Fechar + Editar', selector: '.p-dialog-footer button', count: 2 },
      { label: 'Botão Editar', selector: footerPrimary, text: 'Editar' },
    ],
  }
}

const formOrder = (prefix: string) => [
  { label: 'Campo 1 = Modelo', selector: '.p-dialog-content > div:nth-child(1) label', text: 'Modelo' },
  { label: 'Campo 2 = Chassi (VIN)', selector: '.p-dialog-content > div:nth-child(2) label', text: 'Chassi (VIN)' },
  { label: 'Linha 3 = Marca', selector: '.p-dialog-content > div:nth-child(3) > div:nth-child(1) label', text: 'Marca' },
  { label: 'Linha 3 = Carroceria', selector: '.p-dialog-content > div:nth-child(3) > div:nth-child(2) label', text: 'Carroceria' },
  { label: 'Linha 4 = Ano do modelo', selector: '.p-dialog-content > div:nth-child(4) > div:nth-child(1) label', text: 'Ano do modelo' },
  { label: 'Linha 4 = Quilometragem', selector: '.p-dialog-content > div:nth-child(4) > div:nth-child(2) label', text: 'Quilometragem' },
  { label: 'Linha 5 = Preço', selector: '.p-dialog-content > div:nth-child(5) > div:nth-child(1) label', text: 'Preço' },
  { label: 'Linha 5 = Estoque', selector: '.p-dialog-content > div:nth-child(5) > div:nth-child(2) label', text: 'Estoque' },
  { label: 'Campo 6 = Descrição', selector: '.p-dialog-content > div:nth-child(6) label', text: 'Descrição' },
  { label: 'Rótulo ligado ao campo (for)', selector: `label[for="${prefix}-model"]`, count: 1 },
]

function editDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2073:3806', 'Tela · Carros · Editar carro'),
    id: `cars-edit-dialog-${theme}`,
    label: `Carros — editar carro, ${themeLabel(theme)}`,
    state: 'editar',
    actions: [...openRowMenu(1), menuItem('Editar'), ...dialogOpen],
    renderChecks: [
      { label: 'Título Editar carro', selector: '.p-dialog-header', text: 'Editar carro' },
      ...formOrder('edit-car'),
      { label: 'Modelo preenchido', selector: '#edit-car-model', value: '3 Series' },
      { label: 'VIN preenchido', selector: '#edit-car-vin', value: 'WBA5R1C0XLA123462' },
      { label: 'Botão Salvar alterações', selector: footerPrimary, text: 'Salvar alterações' },
    ],
  }
}

function createDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2073:4133', 'Tela · Carros · Novo carro'),
    id: `cars-create-dialog-${theme}`,
    label: `Carros — novo carro, ${themeLabel(theme)}`,
    state: 'novo carro',
    actions: [waitRows, { type: 'click', selector: 'button:has-text("Novo carro")' }, ...dialogOpen],
    renderChecks: [
      { label: 'Título Novo carro', selector: '.p-dialog-header', text: 'Novo carro' },
      ...formOrder('create-car'),
      { label: 'Botão Cadastrar carro', selector: footerPrimary, text: 'Cadastrar carro' },
    ],
  }
}

// ---------------------------------------------------------------- Functional flows (no Figma)

function flow(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    ...base(theme, 'body'),
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    state: id.replace(/^cars-/, '').replace(/-/g, ' '),
    referenceNote: 'Fluxo funcional sem frame Figma correspondente.',
    ...extra,
  } as VisualScenario
}

const created = { ...cars[0], id: 999, model: 'Teste QA' }
const err400 = (message: string) => ({ status: 400, contentType: 'application/json', body: { message } })

function pagination(theme: Theme) {
  return flow(theme, 'cars-pagination', 'Carros — paginação para a página 2', {
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/cars', cars, 10), pagedMock('/api/cars', cars, 10, 2), jsonMock('/api/brands/options', brandOptions)],
    actions: [
      waitRows,
      { type: 'click', selector: '.p-paginator-page:text-is("2")' },
      { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'CR-V' },
      { type: 'wait', ms: 200 },
    ],
    renderChecks: [
      { label: 'Página 2 com 10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: 'Primeira linha da página 2', selector: '.p-datatable-tbody > tr:first-child', text: 'CR-V' },
      { label: 'Página ativa = 2', selector: '.p-paginator-page-selected', text: '2' },
    ],
  })
}

const openCreate: ScenarioAction[] = [waitRows, { type: 'click', selector: 'button:has-text("Novo carro")' }, ...dialogOpen]
const fillCreate: ScenarioAction[] = [
  { type: 'fill', selector: '.p-dialog input.p-inputtext >> nth=0', value: 'Teste QA' },
  { type: 'click', selector: '.p-dialog .p-select' },
  { type: 'click', selector: '.p-select-overlay .p-select-option:has-text("BMW")' },
  { type: 'click', selector: footerPrimary },
]

function createSuccess(theme: Theme) {
  return flow(theme, 'cars-create-success', 'Carros — cadastrar carro (201) mostra toast e fecha', {
    mocks: [jsonMock(/\/api\/cars$/, created, 201), ...listMocks()],
    actions: [...openCreate, ...fillCreate, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-toast', value: 'Carro criado' }],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast de sucesso', selector: '.p-toast-message-success', text: 'Carro criado' },
    ],
  })
}

function createError(theme: Theme) {
  return flow(theme, 'cars-create-error-400', 'Carros — cadastrar carro com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/cars$/, ...err400('Model year cannot be in the future.') }, ...listMocks()],
    actions: [...openCreate, ...fillCreate, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'Model year cannot be in the future.' }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 da API', selector: '.p-dialog .p-message-error', text: 'Model year cannot be in the future.' },
    ],
  })
}

function createValidation(theme: Theme) {
  return flow(theme, 'cars-create-validation', 'Carros — cadastrar sem modelo/marca mostra validação', {
    actions: [...openCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog .p-message', count: 1 }],
    renderChecks: [{ label: 'Mensagem de validação', selector: '.p-dialog .p-message-error', text: 'Modelo e marca são obrigatórios.' }],
  })
}

const openEdit: ScenarioAction[] = [...openRowMenu(1), menuItem('Editar'), ...dialogOpen]

function editSuccess(theme: Theme) {
  return flow(theme, 'cars-edit-success', 'Carros — salvar edição (200) mostra toast e fecha', {
    mocks: [jsonMock(/\/api\/cars\/\d+$/, { ...figmaCars[0], model: '3 Series QA' }), ...listMocks()],
    actions: [
      ...openEdit,
      { type: 'fill', selector: '.p-dialog input.p-inputtext >> nth=0', value: '3 Series QA' },
      { type: 'click', selector: footerPrimary },
      { type: 'expect-count', selector: '.p-dialog', count: 0 },
      { type: 'expect-text', selector: '.p-toast', value: 'Carro atualizado' },
    ],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast de sucesso', selector: '.p-toast-message-success', text: 'Carro atualizado' },
    ],
  })
}

function editError(theme: Theme) {
  return flow(theme, 'cars-edit-error-400', 'Carros — salvar edição com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/cars\/\d+$/, ...err400('Price cannot be negative.') }, ...listMocks()],
    actions: [...openEdit, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'Price cannot be negative.' }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 da API', selector: '.p-dialog .p-message-error', text: 'Price cannot be negative.' },
    ],
  })
}

const openDelete: ScenarioAction[] = [...openRowMenu(1), menuItem('Excluir'), ...dialogOpen]

function deleteSingle(theme: Theme) {
  return flow(theme, 'cars-delete-dialog', 'Carros — confirmar exclusão de um carro', {
    actions: openDelete,
    renderChecks: [
      { label: 'Título singular', selector: '.p-dialog-header', text: 'Excluir carro?' },
      { label: 'Introdução singular', selector: '.p-dialog-content', text: 'O carro abaixo será removido do estoque:' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Um carro na lista', selector: '.p-dialog ul > li', count: 1 },
      { label: 'Linha do carro', selector: '.p-dialog ul > li', text: 'BMW · Sedan' },
      { label: 'Botão Excluir carro', selector: footerPrimary, text: 'Excluir carro' },
    ],
  })
}

// After a DELETE the real API stops returning the deleted cars. A static list mock would return them again and
// DataTableCommon would keep them hidden for 2s under the `row-fx-leaving` flag (keyed by id), so the reload
// answers with the page minus the deleted ids.
function listAfterDelete(deletedModels: string[]): ScenarioMock[] {
  const before = pagedMock('/api/cars', figmaCars, 10)
  const after = pagedMock('/api/cars', figmaCars.filter((car) => !deletedModels.includes(car.model)), 10)
  return [
    { ...before, responses: [before, after].map(({ status, contentType, body }) => ({ status, contentType, body })) },
    jsonMock('/api/brands/options', brandOptions),
  ]
}

// playRowExit (src/utils/rowEffects.ts) holds the deleted rows for 250ms under reduced motion before reload();
// the toast appears first, so wait for the reloaded list instead of capturing the exit frame.
const afterRowExit = (firstModel: string): ScenarioAction[] => [
  { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: firstModel },
  { type: 'hover', selector: 'h1' },
  { type: 'wait', ms: 400 },
]

function deleteSuccess(theme: Theme) {
  return flow(theme, 'cars-delete-success', 'Carros — excluir carro (204) mostra toast e fecha', {
    mocks: [{ urlPattern: /\/api\/cars\/\d+$/, status: 204, contentType: 'application/json', body: '' }, ...listAfterDelete(['3 Series'])],
    actions: [...openDelete, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-toast', value: 'Carro excluído' }, ...afterRowExit('5 Series')],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast de sucesso', selector: '.p-toast-message-success', text: 'Carro excluído' },
      { label: 'Página 1 recarregada e recompletada com 10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: 'Primeira linha agora = 5 Series', selector: '.p-datatable-tbody > tr:first-child', text: '5 Series' },
      { label: 'Próximo carro do seed sobe para a página (CX-5)', selector: '.p-datatable-tbody > tr:last-child', text: 'CX-5' },
      { label: '3 Series removido da lista', selector: '.p-datatable-tbody > tr:has-text("3 Series")', count: 0 },
      { label: 'Nenhuma linha presa no estado de saída', selector: '.p-datatable-tbody > tr.row-fx-leaving', count: 0 },
    ],
  })
}

function deleteError(theme: Theme) {
  return flow(theme, 'cars-delete-error-400', 'Carros — excluir com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/cars\/\d+$/, ...err400('Car is linked to a customer.') }, ...listMocks()],
    actions: [...openDelete, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message-error >> nth=-1', value: 'Car is linked to a customer.' }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 da API', selector: '.p-dialog .p-message-error:has-text("Car is linked to a customer.")', count: 1 },
    ],
  })
}

const selectTwo: ScenarioAction[] = [
  waitRows,
  { type: 'click', selector: '.p-datatable-tbody > tr:nth-child(1) .p-checkbox' },
  { type: 'click', selector: '.p-datatable-tbody > tr:nth-child(2) .p-checkbox' },
  { type: 'click', selector: 'button:has-text("Excluir selecionados")' },
  ...dialogOpen,
]

function bulkSuccess(theme: Theme) {
  return flow(theme, 'cars-bulk-delete-success', 'Carros — excluir 2 selecionados (204) mostra toast', {
    mocks: [{ urlPattern: /\/api\/cars\/\d+$/, status: 204, contentType: 'application/json', body: '' }, ...listAfterDelete(['3 Series', '5 Series'])],
    actions: [...selectTwo, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-toast', value: '2 carros excluídos' }, ...afterRowExit('A4')],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast de sucesso no plural', selector: '.p-toast-message-success', text: '2 carros excluídos' },
      { label: 'Página 1 recarregada e recompletada com 10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: 'Primeira linha agora = A4', selector: '.p-datatable-tbody > tr:first-child', text: 'A4' },
      { label: 'Próximo carro do seed sobe para a página (e-tron GT)', selector: '.p-datatable-tbody > tr:last-child', text: 'e-tron GT' },
      { label: '3 Series e 5 Series removidos', selector: '.p-datatable-tbody > tr:has-text("Series")', count: 0 },
      { label: 'Nenhuma linha presa no estado de saída', selector: '.p-datatable-tbody > tr.row-fx-leaving', count: 0 },
      { label: 'Seleção limpa após recarregar', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 0 },
    ],
  })
}

function bulkError(theme: Theme) {
  return flow(theme, 'cars-bulk-delete-error', 'Carros — excluir 2 selecionados com 400 mostra erro', {
    mocks: [{ urlPattern: /\/api\/cars\/\d+$/, ...err400('Car is linked to a customer.') }, ...listMocks()],
    actions: [...selectTwo, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message-error >> nth=-1', value: 'Não foi possível excluir' }],
    renderChecks: [
      { label: 'Título com contagem', selector: '.p-dialog-header', text: 'Excluir 2 carros?' },
      { label: 'Erro da exclusão em massa', selector: '.p-dialog .p-message-error:has-text("Não foi possível excluir os carros selecionados.")', count: 1 },
    ],
  })
}

function detailsToEdit(theme: Theme) {
  return flow(theme, 'cars-details-to-edit', 'Carros — Editar nos detalhes abre o diálogo de edição', {
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog-header', value: 'Editar carro' }, { type: 'wait', ms: 300 }],
    baselineActions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Só o diálogo de edição aberto', selector: '.p-dialog', count: 1 },
      { label: 'Título Editar carro', selector: '.p-dialog-header', text: 'Editar carro' },
      { label: 'Carro carregado', selector: '#edit-car-model', value: '3 Series' },
    ],
  })
}

// ---------------------------------------------------------------- PageHeader regression on Brands

function brandsPage(theme: Theme): VisualScenario {
  return {
    id: `brands-page-${theme}`,
    label: `Marcas — tabela paginada (regressão PageHeader), ${themeLabel(theme)}, desktop`,
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/BrandsPage.vue',
    component: () => import('../../src/components/BrandsPage.vue'),
    route: { path: '/brands' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/brands', brands, 10)],
    actions: [{ type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Marcas' },
      { label: 'Botão de criação', selector: 'button:has-text("Nova marca")', count: 1 },
      { label: 'Primeira página com 10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
    ],
  }
}

const both = (fn: (t: Theme) => VisualScenario) => [fn('light'), fn('dark')]

export default [
  ...both(list),
  ...both(rowMenu),
  ...both(rowSelected),
  ...both(bulkDeleteDialog),
  ...both(detailsDialog),
  ...both(editDialog),
  ...both(createDialog),
  ...both(pagination),
  ...both(createSuccess),
  ...both(createError),
  ...both(createValidation),
  ...both(editSuccess),
  ...both(editError),
  ...both(deleteSingle),
  ...both(deleteSuccess),
  ...both(deleteError),
  ...both(bulkSuccess),
  ...both(bulkError),
  ...both(detailsToEdit),
  ...both(brandsPage),
]
