import type { BrandDto } from '../../src/types'
import type { ScenarioAction, ScenarioMock, VisualScenario } from '../types'
import { DESKTOP, brands, jsonMock, pageWidth, pagedMock } from './fixtures'

/**
 * Brands screen refactor (Figma EOvtzuJAvw1UnoH9tsYmiO, canvas 2121:4): list 2113:4, row menu open 2113:885,
 * row selected 2113:1744, details 2113:2596, edit 2113:3486, new 2113:4425, bulk delete blocked 2113:5364,
 * delete single 2114:4132. Frames drawn at 1x, so Figma-compared scenarios capture at DPR 1.
 *
 * Data = the prototype's content: the seed with Portuguese countries and the Audi description as drawn. The
 * English seed (country "Germany") is a known backend gap. The single-delete frame shows Hyundai with 0 cars,
 * so that scenario zeroes its count.
 *
 * Functional flows (states without a frame, CRUD round-trips, 400 messages, paging, Esc) follow `cars-figma.ts`:
 * `/api/brands$` matches only the POST, `/api/brands/<id>$` matches PUT/DELETE.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }
// Odd height: a centred dialog with an odd height lands on a whole pixel (see LEARNINGS "Half-pixel positions").
const VIEWPORT_ODD = { ...VIEWPORT, height: 901 }
const FIGMA_FILE = 'https://www.figma.com/design/EOvtzuJAvw1UnoH9tsYmiO/?node-id='
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')

const COUNTRY: Record<string, string> = { Germany: 'Alemanha', USA: 'EUA', Japan: 'Japão', 'South Korea': 'Coreia do Sul' }
export const figmaBrands: BrandDto[] = brands.map((brand) => ({
  ...brand,
  country: COUNTRY[brand.country] ?? brand.country,
  description: brand.name === 'Audi' ? 'Marca alemã de luxo, conhecida pela tração integral quattro.' : brand.description,
}))
const withBrand = (name: string, patch: Partial<BrandDto>) => figmaBrands.map((b) => (b.name === name ? { ...b, ...patch } : b))
const noCars = { carsCount: 0, cars: [] }

const listMocks = (items: BrandDto[] = figmaBrands): ScenarioMock[] => [pagedMock('/api/brands', items, 10)]

const waitRows: ScenarioAction = { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }
const trigger = (row: number) => `.p-datatable-tbody > tr:nth-child(${row}) button[aria-label="Ações da linha"]`
const openRowMenu = (row = 1): ScenarioAction[] => [
  waitRows,
  { type: 'click', selector: trigger(row) },
  { type: 'expect-count', selector: '.p-menu-overlay', count: 1 },
]
const menuItem = (label: string): ScenarioAction => ({ type: 'click', selector: `.p-menu-overlay .p-menu-item:has-text("${label}")` })
const dialogOpen: ScenarioAction[] = [
  { type: 'expect-count', selector: '.p-dialog', count: 1 },
  { type: 'wait', ms: 600 },
]
const footerPrimary = '.p-dialog .p-dialog-footer button:last-child'
const noCloseFocus = { label: 'Botão fechar sem foco inicial (sem anel)', selector: '.p-dialog-close-button:focus', count: 0 }
const selectRow = (row: number): ScenarioAction => ({ type: 'click', selector: `.p-datatable-tbody > tr:nth-child(${row}) .p-checkbox` })
const bulkButton = 'button:has-text("Excluir selecionados")'

function base(theme: Theme, captureSelector: string) {
  return {
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/BrandsPage.vue',
    component: () => import('../../src/components/BrandsPage.vue'),
    route: { path: '/brands' },
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
    ...figma(theme, '2113:4', 'Tela · Marcas'),
    id: `brands-list-${theme}`,
    label: `Marcas — lista (card), ${themeLabel(theme)}, desktop 1440`,
    actions: [waitRows, { type: 'wait', ms: 200 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Marcas' },
      { label: 'Botão Nova marca', selector: 'button:has-text("Nova marca")', count: 1 },
      { label: 'Busca acima da tabela', selector: '.p-iconfield input[placeholder="Buscar nesta página…"]', count: 1 },
      { label: '10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: '7 colunas (seleção, 5 dados, ações)', selector: '.p-datatable-thead th', count: 7 },
      { label: 'Fundação em dd/mm/aaaa', selector: '.p-datatable-tbody > tr:first-child', text: '16/07/1909' },
      { label: 'Uma página', selector: '.p-paginator-page', count: 1 },
    ],
  }
}

function rowMenuOpen(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figma(theme, '2113:885', 'Tela · Marcas · Menu de ações aberto'),
    id: `brands-row-menu-open-${theme}`,
    label: `Marcas — menu de ações aberto na linha 1, ${themeLabel(theme)}`,
    state: 'menu da linha',
    actions: [...openRowMenu(1), { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Três ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Ação Detalhes', selector: '.p-menu-overlay .p-menu-item >> nth=0', text: 'Detalhes' },
      { label: 'Ação Editar', selector: '.p-menu-overlay .p-menu-item >> nth=1', text: 'Editar' },
      { label: 'Ação Excluir', selector: '.p-menu-overlay .p-menu-item >> nth=2', text: 'Excluir' },
      { label: 'Ícones Lucide', selector: '.p-menu-overlay .p-menu-item svg.lucide', count: 3 },
      { label: 'Gatilho da linha 1 expandido', selector: `${trigger(1)}[aria-expanded="true"]`, count: 1 },
    ],
  }
}

function rowSelected(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figma(theme, '2113:1744', 'Tela · Marcas · Linha selecionada'),
    id: `brands-row-selected-${theme}`,
    label: `Marcas — linha selecionada + exclusão em massa, ${themeLabel(theme)}`,
    state: 'linha selecionada',
    actions: [waitRows, selectRow(1), { type: 'expect-count', selector: bulkButton, count: 1 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Uma linha selecionada', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 1 },
      { label: 'Botão com contagem', selector: bulkButton, text: 'Excluir selecionados (1)' },
    ],
  }
}

function detailsDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2113:2596', 'Tela · Marcas · Detalhes'),
    id: `brands-details-dialog-${theme}`,
    label: `Marcas — detalhes da marca, ${themeLabel(theme)}`,
    state: 'detalhes',
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Título = nome', selector: '.p-dialog-header', text: 'Audi' },
      { label: 'Subtítulo = país', selector: '.p-dialog-header', text: 'Alemanha' },
      { label: 'Três estatísticas', selector: '.p-dialog-content > dl > div', count: 3 },
      { label: 'Seção Carros da marca', selector: '.p-dialog-content h3:text-is("Carros da marca")', count: 1 },
      { label: 'Três carros', selector: '.p-dialog-content li', count: 3 },
      { label: 'Seção Descrição', selector: '.p-dialog-content h3:text-is("Descrição")', count: 1 },
      { label: 'Botões Fechar + Editar', selector: '.p-dialog-footer button', count: 2 },
      { label: 'Botão Editar', selector: footerPrimary, text: 'Editar' },
      noCloseFocus,
    ],
  }
}

const formChecks = (prefix: string) => [
  { label: 'Campo 1 = Nome', selector: `label[for="${prefix}-name"]`, text: 'Nome' },
  { label: 'Campo 2 = País', selector: `label[for="${prefix}-country"]`, text: 'País' },
  { label: 'Campo 3 = Data de fundação', selector: `label[for="${prefix}-founded"]`, text: 'Data de fundação' },
  { label: 'Campo 4 = Descrição', selector: `label[for="${prefix}-description"]`, text: 'Descrição' },
  { label: 'Ícone calendário dentro do campo', selector: '.p-dialog .p-datepicker svg.lucide-calendar', count: 1 },
  noCloseFocus,
]

function editDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2113:3486', 'Tela · Marcas · Editar marca'),
    id: `brands-edit-dialog-${theme}`,
    label: `Marcas — editar marca, ${themeLabel(theme)}`,
    state: 'editar',
    actions: [...openRowMenu(1), menuItem('Editar'), ...dialogOpen],
    renderChecks: [
      { label: 'Título Editar marca', selector: '.p-dialog-header', text: 'Editar marca' },
      ...formChecks('edit-brand'),
      { label: 'Nome preenchido', selector: '#edit-brand-name', value: 'Audi' },
      { label: 'País preenchido', selector: '#edit-brand-country', value: 'Alemanha' },
      { label: 'Data preenchida', selector: '#edit-brand-founded', value: '16/07/1909' },
      { label: 'Botão Salvar alterações', selector: footerPrimary, text: 'Salvar alterações' },
    ],
  }
}

function createDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2113:4425', 'Tela · Marcas · Nova marca'),
    viewport: VIEWPORT_ODD,
    id: `brands-create-dialog-${theme}`,
    label: `Marcas — nova marca, ${themeLabel(theme)}`,
    state: 'nova marca',
    actions: [waitRows, { type: 'click', selector: 'button:has-text("Nova marca")' }, ...dialogOpen],
    renderChecks: [
      { label: 'Título Nova marca', selector: '.p-dialog-header', text: 'Nova marca' },
      ...formChecks('create-brand'),
      { label: 'Placeholder Nome', selector: '#create-brand-name[placeholder="Ex.: Volkswagen"]', count: 1 },
      { label: 'Placeholder País', selector: '#create-brand-country[placeholder="Ex.: Alemanha"]', count: 1 },
      { label: 'Placeholder Data', selector: '#create-brand-founded[placeholder="DD/MM/AAAA"]', count: 1 },
      { label: 'Placeholder Descrição', selector: '#create-brand-description[placeholder="Opcional"]', count: 1 },
      { label: 'Botão Cadastrar marca', selector: footerPrimary, text: 'Cadastrar marca' },
    ],
  }
}

function bulkBlockedDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2113:5364', 'Tela · Marcas · Excluir em lote (bloqueado)'),
    viewport: VIEWPORT_ODD,
    id: `brands-bulk-delete-blocked-dialog-${theme}`,
    label: `Marcas — excluir 1 marca com carros (bloqueado), ${themeLabel(theme)}`,
    state: 'excluir em lote bloqueado',
    actions: [waitRows, selectRow(1), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Título', selector: '.p-dialog-header', text: 'Excluir 1 marca?' },
      { label: 'Banner warn', selector: '.p-dialog .p-message-warn', text: 'Audi tem 3 carros cadastrados. Remova ou transfira os carros antes de excluir a marca.' },
      { label: 'Sem banner de erro', selector: '.p-dialog .p-message-error', count: 0 },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'Marca selecionada:' },
      { label: 'Linha Audi · Alemanha · 3 carros', selector: '.p-dialog ul > li', text: '3 carros' },
      { label: 'Confirmar desabilitado', selector: `${footerPrimary}:disabled`, count: 1 },
      { label: 'Botão Excluir 1 marca', selector: footerPrimary, text: 'Excluir 1 marca' },
      noCloseFocus,
    ],
  }
}

function deleteDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2114:4132', 'Tela · Marcas · Excluir marca'),
    viewport: VIEWPORT_ODD,
    mocks: listMocks(withBrand('Hyundai', noCars)),
    id: `brands-delete-dialog-${theme}`,
    label: `Marcas — excluir Hyundai (sem carros), ${themeLabel(theme)}`,
    state: 'excluir marca',
    actions: [...openRowMenu(6), menuItem('Excluir'), ...dialogOpen],
    renderChecks: [
      { label: 'Título com o nome', selector: '.p-dialog-header', text: 'Excluir Hyundai?' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'A marca será removida do cadastro:' },
      { label: 'Linha Hyundai · 0 carros', selector: '.p-dialog ul > li', text: '0 carros' },
      { label: 'Confirmar habilitado', selector: `${footerPrimary}:disabled`, count: 0 },
      { label: 'Botão Excluir marca', selector: footerPrimary, text: 'Excluir marca' },
      noCloseFocus,
    ],
  }
}

// ---------------------------------------------------------------- States without a frame (approved copy)

function state(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    viewport: VIEWPORT_ODD,
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    state: id.replace(/^brands-/, '').replace(/-/g, ' '),
    referenceNote: 'Estado sem frame Figma: copy aprovada pelo usuário; estilo comparado com os frames 2113:5364 / 2114:4132.',
    ...extra,
  } as VisualScenario
}

const singleBlocked = (theme: Theme) =>
  state(theme, 'brands-delete-blocked', 'Marcas — excluir Audi (com carros) bloqueado', {
    actions: [...openRowMenu(1), menuItem('Excluir'), ...dialogOpen],
    renderChecks: [
      { label: 'Título', selector: '.p-dialog-header', text: 'Excluir Audi?' },
      { label: 'Banner warn', selector: '.p-dialog .p-message-warn', text: 'Audi tem 3 carros cadastrados. Remova ou transfira os carros antes de excluir a marca.' },
      { label: 'Sem banner de erro', selector: '.p-dialog .p-message-error', count: 0 },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'Marca selecionada:' },
      { label: 'Confirmar desabilitado', selector: `${footerPrimary}:disabled`, count: 1 },
      noCloseFocus,
    ],
  })

const singularCar = (theme: Theme) =>
  state(theme, 'brands-delete-blocked-one-car', 'Marcas — excluir marca com 1 carro (singular)', {
    mocks: listMocks(withBrand('Tesla', { carsCount: 1, cars: [{ model: 'Model 3', modelYear: 2024 }] })),
    actions: [...openRowMenu(8), menuItem('Excluir'), ...dialogOpen],
    renderChecks: [
      { label: 'Singular no banner', selector: '.p-dialog .p-message-warn', text: 'Tesla tem 1 carro cadastrado. Remova ou transfira os carros antes de excluir a marca.' },
      { label: 'Meta singular', selector: '.p-dialog ul > li', text: '1 carro' },
      { label: 'Confirmar desabilitado', selector: `${footerPrimary}:disabled`, count: 1 },
    ],
  })

const bulkNotBlocked = (theme: Theme) =>
  state(theme, 'brands-bulk-delete-dialog', 'Marcas — excluir 2 marcas sem carros', {
    mocks: listMocks(withBrand('Hyundai', noCars).map((b) => (b.name === 'Tesla' ? { ...b, ...noCars } : b))),
    actions: [waitRows, selectRow(6), selectRow(8), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Título plural', selector: '.p-dialog-header', text: 'Excluir 2 marcas?' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Introdução plural', selector: '.p-dialog-content > p', text: 'As marcas serão removidas do cadastro:' },
      { label: 'Duas linhas', selector: '.p-dialog ul > li', count: 2 },
      { label: 'Confirmar habilitado', selector: `${footerPrimary}:disabled`, count: 0 },
      { label: 'Botão Excluir 2 marcas', selector: footerPrimary, text: 'Excluir 2 marcas' },
    ],
  })

const bulkManyBlocked = (theme: Theme) =>
  state(theme, 'brands-bulk-delete-blocked-many', 'Marcas — excluir 3 marcas com carros (bloqueado)', {
    actions: [waitRows, selectRow(1), selectRow(2), selectRow(3), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Título', selector: '.p-dialog-header', text: 'Excluir 3 marcas?' },
      { label: 'Banner warn plural', selector: '.p-dialog .p-message-warn', text: 'Audi, BMW e Chevrolet têm carros cadastrados. Remova ou transfira os carros antes de excluir as marcas.' },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'Marcas selecionadas:' },
      { label: 'Três linhas', selector: '.p-dialog ul > li', count: 3 },
      { label: 'Confirmar desabilitado', selector: `${footerPrimary}:disabled`, count: 1 },
    ],
  })

const bulkMixed = (theme: Theme) =>
  state(theme, 'brands-bulk-delete-blocked-mixed', 'Marcas — excluir 2 marcas, 1 com carros (bloqueado)', {
    mocks: listMocks(withBrand('Hyundai', noCars)),
    actions: [waitRows, selectRow(1), selectRow(6), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Banner warn só com a bloqueada', selector: '.p-dialog .p-message-warn', text: 'Audi tem 3 carros cadastrados.' },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'Marcas selecionadas:' },
      { label: 'Confirmar desabilitado', selector: `${footerPrimary}:disabled`, count: 1 },
    ],
  })

const detailsEmpty = (theme: Theme) =>
  state(theme, 'brands-details-empty', 'Marcas — detalhes sem carros e sem descrição', {
    viewport: VIEWPORT,
    mocks: listMocks(withBrand('Hyundai', { ...noCars, description: '' })),
    actions: [...openRowMenu(6), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Sem carros', selector: '.p-dialog-content', text: 'Nenhum carro cadastrado.' },
      { label: 'Sem descrição', selector: '.p-dialog-content', text: 'Sem descrição.' },
      { label: 'Carros = 0', selector: '.p-dialog-content > dl > div:nth-child(3) dd', text: '0' },
    ],
  })

// ---------------------------------------------------------------- Functional flows

function flow(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    ...base(theme, 'body'),
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    state: id.replace(/^brands-/, '').replace(/-/g, ' '),
    referenceNote: 'Fluxo funcional sem frame Figma correspondente.',
    ...extra,
  } as VisualScenario
}

const err400 = (message: string) => ({ status: 400, contentType: 'application/json', body: { message } })
const listThen = (before: BrandDto[], after: BrandDto[]): ScenarioMock => {
  const a = pagedMock('/api/brands', before, 10)
  const b = pagedMock('/api/brands', after, 10)
  return { ...a, responses: [a, b].map(({ status, contentType, body }) => ({ status, contentType, body })) }
}

const manyBrands: BrandDto[] = [
  ...figmaBrands,
  ...Array.from({ length: 15 }, (_, i) => ({ ...figmaBrands[0], id: 100 + i, name: `Marca QA ${String(i + 1).padStart(2, '0')}`, carsCount: 0, cars: [] })),
]

// The base commit's Brands dialogs have no field ids, so flows that type into them only show the list at the base.
const baseListOnly: ScenarioAction[] = [waitRows, { type: 'wait', ms: 300 }]

const pagination = (theme: Theme) =>
  flow(theme, 'brands-pagination', 'Marcas — paginação no servidor para a página 2', {
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/brands', manyBrands, 10), pagedMock('/api/brands', manyBrands, 10, 2)],
    actions: [waitRows, { type: 'click', selector: '.p-paginator-page:text-is("2")' }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Marca QA 01' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Página 2 com 10 linhas (servidor)', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: 'Primeira linha da página 2', selector: '.p-datatable-tbody > tr:first-child', text: 'Marca QA 01' },
      { label: 'Página ativa = 2', selector: '.p-paginator-page-selected', text: '2' },
      { label: 'Três páginas', selector: '.p-paginator-page', count: 3 },
    ],
  })

const created: BrandDto = { ...figmaBrands[0], id: 999, name: 'Alfa QA', country: 'Itália', carsCount: 0, cars: [] }
const openCreate: ScenarioAction[] = [waitRows, { type: 'click', selector: 'button:has-text("Nova marca")' }, ...dialogOpen]
const fillCreate: ScenarioAction[] = [
  { type: 'fill', selector: '#create-brand-name', value: 'Alfa QA' },
  { type: 'fill', selector: '#create-brand-country', value: 'Itália' },
  { type: 'fill', selector: '#create-brand-founded', value: '24/06/1910' },
  // Pick the typed day in the open panel: selecting a date closes it (Esc would also close the dialog).
  { type: 'click', selector: '.p-datepicker-panel td:not(.p-datepicker-other-month) span:text-is("24")' },
  { type: 'expect-count', selector: '.p-datepicker-panel', count: 0 },
  { type: 'wait', ms: 300 },
]

const createSuccess = (theme: Theme) =>
  flow(theme, 'brands-create-success', 'Marcas — cadastrar (201) fecha, toast e recarrega', {
    baselineActions: baseListOnly,
    mocks: [jsonMock(/\/api\/brands$/, created, 201), listThen(figmaBrands, [created, ...figmaBrands])],
    actions: [...openCreate, ...fillCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Alfa QA' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast Marca criada', selector: '.p-toast-message-success', text: 'Marca criada' },
      { label: 'Tabela recarregada com a nova marca', selector: '.p-datatable-tbody > tr:first-child', text: 'Alfa QA' },
    ],
  })

const createError = (theme: Theme) =>
  flow(theme, 'brands-create-error-400', 'Marcas — cadastrar com 400 mostra a mensagem da API', {
    baselineActions: baseListOnly,
    mocks: [{ urlPattern: /\/api\/brands$/, ...err400('Founded date cannot be in the future.') }, ...listMocks()],
    actions: [...openCreate, ...fillCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'Founded date cannot be in the future.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 em Message error', selector: '.p-dialog .p-message-error', text: 'Founded date cannot be in the future.' },
    ],
  })

const createValidation = (theme: Theme) =>
  flow(theme, 'brands-create-validation', 'Marcas — cadastrar vazio mostra validação', {
    actions: [...openCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog .p-message', count: 1 }, { type: 'wait', ms: 300 }],
    renderChecks: [{ label: 'Mensagem de validação', selector: '.p-dialog .p-message-error', text: 'Nome e data de fundação são obrigatórios.' }],
  })

const openEdit: ScenarioAction[] = [...openRowMenu(1), menuItem('Editar'), ...dialogOpen]

const editSuccess = (theme: Theme) =>
  flow(theme, 'brands-edit-success', 'Marcas — salvar edição (200) fecha, toast e recarrega', {
    baselineActions: baseListOnly,
    mocks: [jsonMock(/\/api\/brands\/\d+$/, { ...figmaBrands[0], name: 'Audi QA' }), listThen(figmaBrands, withBrand('Audi', { name: 'Audi QA' }))],
    actions: [...openEdit, { type: 'fill', selector: '#edit-brand-name', value: 'Audi QA' }, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Audi QA' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast Marca atualizada', selector: '.p-toast-message-success', text: 'Marca atualizada' },
      { label: 'Tabela recarregada', selector: '.p-datatable-tbody > tr:first-child', text: 'Audi QA' },
    ],
  })

const editError = (theme: Theme) =>
  flow(theme, 'brands-edit-error-400', 'Marcas — salvar edição com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/brands\/\d+$/, ...err400('Brand name is required.') }, ...listMocks()],
    actions: [...openEdit, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'Brand name is required.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 em Message error', selector: '.p-dialog .p-message-error', text: 'Brand name is required.' },
    ],
  })

const editValidation = (theme: Theme) =>
  flow(theme, 'brands-edit-validation', 'Marcas — editar com nome vazio mostra validação', {
    baselineActions: baseListOnly,
    actions: [...openEdit, { type: 'fill', selector: '#edit-brand-name', value: '' }, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog .p-message', count: 1 }, { type: 'wait', ms: 300 }],
    renderChecks: [{ label: 'Mensagem de validação', selector: '.p-dialog .p-message-error', text: 'Nome e data de fundação são obrigatórios.' }],
  })

const detailsToEdit = (theme: Theme) =>
  flow(theme, 'brands-details-to-edit', 'Marcas — Editar nos detalhes fecha detalhes e abre edição', {
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog-header', value: 'Editar marca' }, { type: 'wait', ms: 600 }],
    baselineActions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Só o diálogo de edição aberto', selector: '.p-dialog', count: 1 },
      { label: 'Título Editar marca', selector: '.p-dialog-header', text: 'Editar marca' },
      { label: 'Marca carregada', selector: '#edit-brand-name', value: 'Audi' },
      noCloseFocus,
    ],
  })

const hyundaiFree = withBrand('Hyundai', noCars)

const deleteSuccess = (theme: Theme) =>
  flow(theme, 'brands-delete-success', 'Marcas — excluir (204) fecha, toast e recarrega', {
    mocks: [{ urlPattern: /\/api\/brands\/\d+$/, status: 204, contentType: 'application/json', body: '' }, listThen(hyundaiFree, hyundaiFree.filter((b) => b.name !== 'Hyundai'))],
    actions: [...openRowMenu(6), menuItem('Excluir'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 9 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Toast Marca excluída', selector: '.p-toast-message-success', text: 'Marca excluída' },
      { label: 'Hyundai removida após recarregar', selector: '.p-datatable-tbody > tr:has-text("Hyundai")', count: 0 },
      { label: 'Nenhuma linha presa no estado de saída', selector: '.p-datatable-tbody > tr.row-fx-leaving', count: 0 },
    ],
  })

const deleteError = (theme: Theme) =>
  flow(theme, 'brands-delete-error-400', 'Marcas — excluir com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/brands\/\d+$/, ...err400('Cannot delete a brand that has cars.') }, ...listMocks(hyundaiFree)],
    actions: [...openRowMenu(6), menuItem('Excluir'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message-error >> nth=-1', value: 'Cannot delete a brand that has cars.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 da API', selector: '.p-dialog .p-message-error:has-text("Cannot delete a brand that has cars.")', count: 1 },
    ],
  })

const twoFree = hyundaiFree.map((b) => (b.name === 'Tesla' ? { ...b, ...noCars } : b))
const bulkSuccess = (theme: Theme) =>
  flow(theme, 'brands-bulk-delete-success', 'Marcas — excluir 2 selecionadas (204) toast e recarrega', {
    mocks: [{ urlPattern: /\/api\/brands\/\d+$/, status: 204, contentType: 'application/json', body: '' }, listThen(twoFree, twoFree.filter((b) => !['Hyundai', 'Tesla'].includes(b.name)))],
    actions: [waitRows, selectRow(6), selectRow(8), { type: 'click', selector: bulkButton }, ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 8 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Toast plural', selector: '.p-toast-message-success', text: '2 marcas excluídas' },
      { label: '8 linhas após recarregar', selector: '.p-datatable-tbody > tr', count: 8 },
      { label: 'Seleção limpa', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 0 },
    ],
  })

const escCloses = (theme: Theme) =>
  flow(theme, 'brands-esc-closes', 'Marcas — Esc fecha o diálogo de detalhes', {
    captureSelector: '#preview-root > div',
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen, { type: 'press', selector: '.p-dialog', value: 'Escape' }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [{ label: 'Diálogo fechado com Esc', selector: '.p-dialog', count: 0 }],
  })

const escClosesCreate = (theme: Theme) =>
  flow(theme, 'brands-esc-closes-create', 'Marcas — Esc fecha o diálogo Nova marca', {
    captureSelector: '#preview-root > div',
    actions: [...openCreate, { type: 'press', selector: '.p-dialog', value: 'Escape' }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [{ label: 'Diálogo fechado com Esc', selector: '.p-dialog', count: 0 }],
  })

const both = (fn: (t: Theme) => VisualScenario) => [fn('light'), fn('dark')]

export default [
  ...both(list),
  ...both(rowMenuOpen),
  ...both(rowSelected),
  ...both(detailsDialog),
  ...both(editDialog),
  ...both(createDialog),
  ...both(bulkBlockedDialog),
  ...both(deleteDialog),
  ...both(singleBlocked),
  ...both(singularCar),
  ...both(bulkNotBlocked),
  ...both(bulkManyBlocked),
  ...both(bulkMixed),
  ...both(detailsEmpty),
  ...both(pagination),
  ...both(createSuccess),
  ...both(createError),
  ...both(createValidation),
  ...both(editSuccess),
  ...both(editError),
  ...both(editValidation),
  ...both(detailsToEdit),
  ...both(deleteSuccess),
  ...both(deleteError),
  ...both(bulkSuccess),
  ...both(escCloses),
  ...both(escClosesCreate),
]
