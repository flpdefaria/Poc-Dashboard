import type { CarOption, CustomerDto } from '../../src/types'
import type { ScenarioAction, ScenarioMock, VisualScenario } from '../types'
import { DESKTOP, customers, jsonMock, pageWidth, pagedMock } from './fixtures'
import carOptionsJson from './fixtures/car-options.json' with { type: 'json' }

/**
 * Customers screen refactor (Figma EOvtzuJAvw1UnoH9tsYmiO, canvas 2138:4): list 2134:4 (main 2134:6), row menu
 * 2134:269 (menu 2134:277), row selected 2134:535 (main 2134:537), details 2134:802 (2134:811), edit 2134:1106
 * (2134:1115), new 2134:1392 (2134:1401), delete single 2134:1678 (2134:1687). Frames drawn at 1x: DPR 1.
 *
 * References: the dialog nodes have cached `get_screenshot` exports (440px with shadow, cropped x20 y0 to the node
 * size). The list/menu/selected frames have no usable PNG (the cached 2134:6 export is downscaled to 1024px and the
 * other two were never exported), so those scenarios carry a spec only and no `figmaNode`.
 *
 * Data = the prototype's content: the seed with `@email.com` addresses and `(11) 95550-01xx` phones as drawn. The
 * seed (`@example.com`, `555-01xx`) is a known content difference, not a layout one.
 *
 * Functional flows (states without a frame, CRUD round-trips, 400 messages, paging, Esc) follow `brands-figma.ts`:
 * `/api/customers$` matches only the POST, `/api/customers/<id>$` matches PUT/DELETE.
 */
const VIEWPORT = { ...DESKTOP, deviceScaleFactor: 1 }
// Odd height: a centred dialog with an odd height lands on a whole pixel (see LEARNINGS "Half-pixel positions").
const VIEWPORT_ODD = { ...VIEWPORT, height: 901 }
const FIGMA_FILE = 'https://www.figma.com/design/EOvtzuJAvw1UnoH9tsYmiO/?node-id='
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')
const carOptions = carOptionsJson as CarOption[]

const prototype = (c: CustomerDto): CustomerDto => ({
  ...c,
  email: c.email.replace('@example.com', '@email.com'),
  // "555-0101" -> "(11) 95550-0101", as drawn in 2134:6.
  phoneNumber: c.phoneNumber ? c.phoneNumber.replace(/^(\d{3})-(\d{4})$/, (_, a: string, b: string) => `(11) 9${a}0-${b}`) : null,
})
/** The 10 customers drawn in 2134:6 (one page). The seed has 15; `manyCustomers` keeps all of them for paging. */
export const figmaCustomers: CustomerDto[] = customers.slice(0, 10).map(prototype)
const manyCustomers: CustomerDto[] = customers.map(prototype)
const withCustomer = (name: string, patch: Partial<CustomerDto>) => figmaCustomers.map((c) => (c.fullName === name ? { ...c, ...patch } : c))

const listMocks = (items: CustomerDto[] = figmaCustomers): ScenarioMock[] => [pagedMock('/api/customers', items, 10), jsonMock('/api/cars/options', carOptions)]

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
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: VIEWPORT,
    mountWidth: pageWidth(VIEWPORT.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop' as const,
    captureSelector,
    mocks: listMocks(),
  }
}

/** Dialog frames: PNG + spec, `figmaNode` required on light. */
function figma(theme: Theme, nodeId: string, name: string) {
  return theme === 'light'
    ? { figmaNode: { nodeId, name, url: `${FIGMA_FILE}${nodeId.replace(':', '-')}` } }
    : { referenceNote: 'O arquivo Figma só desenha o tema claro; o escuro é revisado visualmente.' }
}

/** Page frames: spec only (no usable PNG in .figma-cache, MCP not called by instruction). */
function figmaSpecOnly(theme: Theme, nodeId: string) {
  return {
    referenceNote:
      theme === 'light'
        ? `Frame ${nodeId}: só spec (.figma.json). PNG ausente no .figma-cache (2134-6 exportado reduzido a 1024px; 2134-269/2134-535 sem export) e o MCP não foi chamado por instrução.`
        : 'O arquivo Figma só desenha o tema claro; o escuro é revisado visualmente.',
  }
}

// ---------------------------------------------------------------- Figma-compared states

function list(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figmaSpecOnly(theme, '2134:6'),
    id: `customers-list-${theme}`,
    label: `Clientes — lista (card), ${themeLabel(theme)}, desktop 1440`,
    actions: [waitRows, { type: 'wait', ms: 200 }],
    renderChecks: [
      { label: 'Título da página', selector: 'h1', text: 'Clientes' },
      { label: 'Botão Novo cliente', selector: 'button:has-text("Novo cliente")', count: 1 },
      { label: 'Ícone plus no botão', selector: 'button:has-text("Novo cliente") svg.lucide-plus', count: 1 },
      { label: 'Busca acima da tabela', selector: '.p-iconfield input[placeholder="Buscar nesta página…"]', count: 1 },
      { label: 'Modo card', selector: '.dt-card', count: 1 },
      { label: '10 linhas', selector: '.p-datatable-tbody > tr', count: 10 },
      { label: '6 colunas (seleção, 4 dados, ações)', selector: '.p-datatable-thead th', count: 6 },
      { label: 'Cabeçalho Nome completo', selector: '.p-datatable-thead th:nth-child(2)', text: 'Nome completo' },
      { label: 'Cabeçalho E-mail', selector: '.p-datatable-thead th:nth-child(3)', text: 'E-mail' },
      { label: 'Cabeçalho Telefone', selector: '.p-datatable-thead th:nth-child(4)', text: 'Telefone' },
      { label: 'Cabeçalho Cadastrado em', selector: '.p-datatable-thead th:nth-child(5)', text: 'Cadastrado em' },
      { label: 'Cabeçalho Ações', selector: '.p-datatable-thead th:nth-child(6)', text: 'Ações' },
      { label: 'Quatro colunas ordenáveis', selector: '.p-datatable-thead th.p-datatable-sortable-column', count: 4 },
      { label: 'Data dd/mm/aaaa', selector: '.p-datatable-tbody > tr:first-child > td:nth-child(5)', text: '15/03/2021' },
      { label: 'Telefone nulo = travessão (Carol)', selector: '.p-datatable-tbody > tr:nth-child(3) > td:nth-child(4)', text: '—' },
      { label: 'Telefone nulo = travessão (Henry)', selector: '.p-datatable-tbody > tr:nth-child(8) > td:nth-child(4)', text: '—' },
      { label: 'Uma página', selector: '.p-paginator-page', count: 1 },
    ],
  }
}

function rowMenuOpen(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figmaSpecOnly(theme, '2134:269'),
    id: `customers-row-menu-open-${theme}`,
    label: `Clientes — menu de ações aberto na linha 1, ${themeLabel(theme)}`,
    state: 'menu da linha',
    actions: [...openRowMenu(1), { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Três ações', selector: '.p-menu-overlay .p-menu-item', count: 3 },
      { label: 'Ação Detalhes', selector: '.p-menu-overlay .p-menu-item >> nth=0', text: 'Detalhes' },
      { label: 'Ação Editar', selector: '.p-menu-overlay .p-menu-item >> nth=1', text: 'Editar' },
      { label: 'Ação Excluir', selector: '.p-menu-overlay .p-menu-item >> nth=2', text: 'Excluir' },
      { label: 'Ícone eye', selector: '.p-menu-overlay .p-menu-item svg.lucide-eye', count: 1 },
      { label: 'Ícone pencil', selector: '.p-menu-overlay .p-menu-item svg.lucide-pencil', count: 1 },
      { label: 'Ícones Lucide', selector: '.p-menu-overlay .p-menu-item svg.lucide', count: 3 },
      { label: 'Gatilho da linha 1 expandido', selector: `${trigger(1)}[aria-expanded="true"]`, count: 1 },
    ],
  }
}

function rowSelected(theme: Theme): VisualScenario {
  return {
    ...base(theme, '#preview-root > div'),
    ...figmaSpecOnly(theme, '2134:537'),
    id: `customers-row-selected-figma-${theme}`,
    label: `Clientes — linha selecionada + exclusão em massa, ${themeLabel(theme)}`,
    state: 'linha selecionada',
    actions: [waitRows, selectRow(1), { type: 'expect-count', selector: bulkButton, count: 1 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Uma linha selecionada', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 1 },
      { label: 'Botão com contagem', selector: bulkButton, text: 'Excluir selecionados (1)' },
      { label: 'Ícone trash no botão', selector: `${bulkButton} svg.lucide`, count: 1 },
    ],
  }
}

function detailsDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2134:811', 'Tela · Clientes · Detalhes'),
    id: `customers-details-dialog-${theme}`,
    label: `Clientes — detalhes do cliente, ${themeLabel(theme)}`,
    state: 'detalhes',
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Título = nome', selector: '.p-dialog-header', text: 'Alice Johnson' },
      { label: 'Subtítulo Cliente desde', selector: '.p-dialog-header', text: 'Cliente desde 15/03/2021' },
      { label: 'Ícone id-card', selector: '.p-dialog-header svg.lucide-id-card', count: 1 },
      { label: 'Seção Informações', selector: '.p-dialog-content h3:text-is("Informações")', count: 1 },
      { label: 'Três linhas de info', selector: '.p-dialog-content dl > div', count: 3 },
      { label: 'E-mail', selector: '.p-dialog-content dl > div:nth-child(1)', text: 'alice.johnson@email.com' },
      { label: 'Telefone', selector: '.p-dialog-content dl > div:nth-child(2)', text: '(11) 95550-0101' },
      { label: 'Carro', selector: '.p-dialog-content dl > div:nth-child(3)', text: 'Toyota Corolla' },
      { label: 'Botões Fechar + Editar', selector: '.p-dialog-footer button', count: 2 },
      { label: 'Botão Editar', selector: footerPrimary, text: 'Editar' },
      noCloseFocus,
    ],
  }
}

const formChecks = (prefix: string) => [
  { label: 'Campo 1 = Nome completo', selector: `label[for="${prefix}-name"]`, text: 'Nome completo' },
  { label: 'Campo 2 = E-mail', selector: `label[for="${prefix}-email"]`, text: 'E-mail' },
  { label: 'Campo 3 = Telefone', selector: `label[for="${prefix}-phone"]`, text: 'Telefone' },
  { label: 'Campo 4 = Carro', selector: `label[for="${prefix}-car"]`, text: 'Carro' },
  { label: 'Select do carro com chevron Lucide', selector: '.p-dialog .p-select svg.lucide-chevron-down', count: 1 },
  { label: 'Dois botões no rodapé', selector: '.p-dialog-footer button', count: 2 },
  { label: 'Botão Cancelar', selector: '.p-dialog-footer button:first-child', text: 'Cancelar' },
  noCloseFocus,
]

function editDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2134:1115', 'Tela · Clientes · Editar cliente'),
    id: `customers-edit-dialog-${theme}`,
    label: `Clientes — editar cliente, ${themeLabel(theme)}`,
    state: 'editar',
    actions: [...openRowMenu(1), menuItem('Editar'), ...dialogOpen],
    renderChecks: [
      { label: 'Título Editar cliente', selector: '.p-dialog-header', text: 'Editar cliente' },
      ...formChecks('edit-customer'),
      { label: 'Nome preenchido', selector: '#edit-customer-name', value: 'Alice Johnson' },
      { label: 'E-mail preenchido', selector: '#edit-customer-email', value: 'alice.johnson@email.com' },
      { label: 'Telefone preenchido', selector: '#edit-customer-phone', value: '(11) 95550-0101' },
      { label: 'Carro preenchido', selector: '.p-dialog .p-select-label', text: 'Toyota Corolla' },
      { label: 'Botão Salvar alterações', selector: footerPrimary, text: 'Salvar alterações' },
    ],
  }
}

function createDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2134:1401', 'Tela · Clientes · Novo cliente'),
    id: `customers-create-dialog-${theme}`,
    label: `Clientes — novo cliente, ${themeLabel(theme)}`,
    state: 'novo cliente',
    actions: [waitRows, { type: 'click', selector: 'button:has-text("Novo cliente")' }, ...dialogOpen],
    renderChecks: [
      { label: 'Título Novo cliente', selector: '.p-dialog-header', text: 'Novo cliente' },
      ...formChecks('create-customer'),
      { label: 'Placeholder Nome', selector: '#create-customer-name[placeholder="Ex.: Maria Silva"]', count: 1 },
      { label: 'Placeholder E-mail', selector: '#create-customer-email[placeholder="nome@email.com"]', count: 1 },
      { label: 'Placeholder Telefone', selector: '#create-customer-phone[placeholder="(00) 00000-0000"]', count: 1 },
      { label: 'Placeholder Carro', selector: '.p-dialog .p-select-label', text: 'Sem carro' },
      { label: 'Sem ícone de limpar sem valor', selector: '.p-dialog .p-select-clear-icon', count: 0 },
      { label: 'Botão Cadastrar cliente', selector: footerPrimary, text: 'Cadastrar cliente' },
    ],
  }
}

function deleteDialog(theme: Theme): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    ...figma(theme, '2134:1687', 'Tela · Clientes · Excluir cliente'),
    viewport: VIEWPORT_ODD,
    id: `customers-delete-dialog-figma-${theme}`,
    label: `Clientes — excluir Alice Johnson, ${themeLabel(theme)}`,
    state: 'excluir cliente',
    actions: [...openRowMenu(1), menuItem('Excluir'), ...dialogOpen],
    renderChecks: [
      { label: 'Título com o nome', selector: '.p-dialog-header', text: 'Excluir Alice Johnson?' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Introdução', selector: '.p-dialog-content > p', text: 'O cliente será removido do cadastro:' },
      { label: 'Uma linha', selector: '.p-dialog ul > li', count: 1 },
      { label: 'Linha: e-mail', selector: '.p-dialog ul > li', text: 'alice.johnson@email.com' },
      { label: 'Linha: telefone', selector: '.p-dialog ul > li', text: '(11) 95550-0101' },
      { label: 'Botão Excluir cliente', selector: footerPrimary, text: 'Excluir cliente' },
      { label: 'Ícone trash no botão', selector: `${footerPrimary} svg.lucide`, count: 1 },
      noCloseFocus,
    ],
  }
}

// ---------------------------------------------------------------- States without a frame

function state(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    ...base(theme, '.p-dialog'),
    viewport: VIEWPORT_ODD,
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    state: id.replace(/^customers-/, '').replace(/-/g, ' '),
    referenceNote: 'Estado sem frame Figma: estilo comparado com os frames 2134:811 / 2134:1115 / 2134:1687.',
    ...extra,
  } as VisualScenario
}

const bulkDialog = (theme: Theme) =>
  state(theme, 'customers-bulk-delete-dialog', 'Clientes — excluir 2 selecionados', {
    actions: [waitRows, selectRow(1), selectRow(3), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Título plural', selector: '.p-dialog-header', text: 'Excluir 2 clientes?' },
      { label: 'Banner de erro', selector: '.p-dialog .p-message-error', text: 'Esta ação não pode ser desfeita.' },
      { label: 'Introdução plural', selector: '.p-dialog-content > p', text: 'Os clientes serão removidos do cadastro:' },
      { label: 'Duas linhas', selector: '.p-dialog ul > li', count: 2 },
      { label: 'Botão Excluir 2 clientes', selector: footerPrimary, text: 'Excluir 2 clientes' },
      noCloseFocus,
    ],
  })

const bulkOneDialog = (theme: Theme) =>
  state(theme, 'customers-bulk-delete-one-dialog', 'Clientes — excluir 1 selecionado (singular)', {
    actions: [waitRows, selectRow(2), { type: 'click', selector: bulkButton }, ...dialogOpen],
    renderChecks: [
      { label: 'Título singular', selector: '.p-dialog-header', text: 'Excluir 1 cliente?' },
      { label: 'Introdução singular', selector: '.p-dialog-content > p', text: 'O cliente será removido do cadastro:' },
      { label: 'Botão Excluir 1 cliente', selector: footerPrimary, text: 'Excluir 1 cliente' },
    ],
  })

const deleteNoPhone = (theme: Theme) =>
  state(theme, 'customers-delete-no-phone', 'Clientes — excluir cliente sem telefone (Carol)', {
    actions: [...openRowMenu(3), menuItem('Excluir'), ...dialogOpen],
    renderChecks: [
      { label: 'Título', selector: '.p-dialog-header', text: 'Excluir Carol Williams?' },
      { label: 'Linha com e-mail', selector: '.p-dialog ul > li', text: 'carol.williams@email.com' },
    ],
  })

const detailsEmpty = (theme: Theme) =>
  state(theme, 'customers-details-no-phone-no-car', 'Clientes — detalhes sem telefone e sem carro (Henry)', {
    viewport: VIEWPORT,
    actions: [...openRowMenu(8), menuItem('Detalhes'), ...dialogOpen],
    renderChecks: [
      { label: 'Título', selector: '.p-dialog-header', text: 'Henry Wilson' },
      { label: 'Telefone = —', selector: '.p-dialog-content dl > div:nth-child(2) dd', text: '—' },
      { label: 'Carro = —', selector: '.p-dialog-content dl > div:nth-child(3) dd', text: '—' },
    ],
  })

const editNoCar = (theme: Theme) =>
  state(theme, 'customers-edit-no-car', 'Clientes — editar cliente sem carro (placeholder Sem carro)', {
    viewport: VIEWPORT,
    actions: [...openRowMenu(8), menuItem('Editar'), ...dialogOpen],
    renderChecks: [
      { label: 'Placeholder Sem carro', selector: '.p-dialog .p-select-label', text: 'Sem carro' },
      { label: 'Telefone vazio', selector: '#edit-customer-phone', value: '' },
      { label: 'Sem ícone de limpar', selector: '.p-dialog .p-select-clear-icon', count: 0 },
    ],
  })

const editClearCar = (theme: Theme) =>
  state(theme, 'customers-edit-clear-car', 'Clientes — editar, limpar o carro com o X', {
    viewport: VIEWPORT,
    actions: [...openRowMenu(1), menuItem('Editar'), ...dialogOpen, { type: 'click', selector: '.p-dialog .p-select-clear-icon' }, { type: 'expect-text', selector: '.p-dialog .p-select-label', value: 'Sem carro' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Carro limpo = Sem carro', selector: '.p-dialog .p-select-label', text: 'Sem carro' },
      { label: 'Painel não abriu ao limpar', selector: '.p-select-overlay', count: 0 },
    ],
  })

// ---------------------------------------------------------------- Functional flows

// The base dialogs use other field ids and copy, so a flow cannot be replayed there: the base capture is the list.
const baselineList: ScenarioAction[] = [waitRows, { type: 'wait', ms: 300 }]

function flow(theme: Theme, id: string, label: string, extra: Partial<VisualScenario>): VisualScenario {
  return {
    ...base(theme, 'body'),
    baselineActions: baselineList,
    id: `${id}-${theme}`,
    label: `${label}, ${themeLabel(theme)}`,
    state: id.replace(/^customers-/, '').replace(/-/g, ' '),
    referenceNote: 'Fluxo funcional sem frame Figma correspondente.',
    ...extra,
  } as VisualScenario
}

const err400 = (message: string) => ({ status: 400, contentType: 'application/json', body: { message } })
const listThen = (before: CustomerDto[], after: CustomerDto[]): ScenarioMock => {
  const a = pagedMock('/api/customers', before, 10)
  const b = pagedMock('/api/customers', after, 10)
  return { ...a, responses: [a, b].map(({ status, contentType, body }) => ({ status, contentType, body })) }
}
const carsMock = jsonMock('/api/cars/options', carOptions)


const pagination = (theme: Theme) =>
  flow(theme, 'customers-pagination', 'Clientes — paginação no servidor para a página 2', {
    captureSelector: '#preview-root > div',
    mocks: [pagedMock('/api/customers', manyCustomers, 10), pagedMock('/api/customers', manyCustomers, 10, 2), carsMock],
    actions: [waitRows, { type: 'click', selector: '.p-paginator-page:text-is("2")' }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Karen White' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Página 2 com 5 linhas (servidor)', selector: '.p-datatable-tbody > tr', count: 5 },
      { label: 'Primeira linha da página 2', selector: '.p-datatable-tbody > tr:first-child', text: 'Karen White' },
      { label: 'Página ativa = 2', selector: '.p-paginator-page-selected', text: '2' },
    ],
  })

const listError = (theme: Theme) =>
  flow(theme, 'customers-list-error', 'Clientes — falha ao carregar a lista', {
    captureSelector: '#preview-root > div',
    mocks: [{ urlPattern: /\/api\/customers\?page=1&pageSize=10$/, status: 500, contentType: 'application/json', body: { message: 'Erro interno.' } }, carsMock],
    actions: [{ type: 'expect-count', selector: '.p-message-error', count: 1 }, { type: 'wait', ms: 300 }],
    baselineActions: [{ type: 'expect-count', selector: '.p-message-error', count: 1 }, { type: 'wait', ms: 300 }],
    renderChecks: [{ label: 'Message de erro acima da tabela', selector: '.p-message-error', count: 1 }],
  })

const created: CustomerDto = { ...figmaCustomers[0], id: 999, fullName: 'Ana QA', email: 'ana.qa@email.com', phoneNumber: null, carId: null, carName: null }
const openCreate: ScenarioAction[] = [waitRows, { type: 'click', selector: 'button:has-text("Novo cliente")' }, ...dialogOpen]
const fillCreate: ScenarioAction[] = [
  { type: 'fill', selector: '#create-customer-name', value: 'Ana QA' },
  { type: 'fill', selector: '#create-customer-email', value: 'ana.qa@email.com' },
]

const createSuccess = (theme: Theme) =>
  flow(theme, 'customers-create-success', 'Clientes — cadastrar (201) fecha, toast e recarrega', {
    mocks: [jsonMock(/\/api\/customers$/, created, 201), listThen(figmaCustomers, [created, ...figmaCustomers]), carsMock],
    actions: [...openCreate, ...fillCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Ana QA' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast Cliente criado', selector: '.p-toast-message-success', text: 'Cliente criado' },
      { label: 'Tabela recarregada com o novo cliente', selector: '.p-datatable-tbody > tr:first-child', text: 'Ana QA' },
    ],
  })

const createError = (theme: Theme) =>
  flow(theme, 'customers-create-error-400', 'Clientes — cadastrar com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/customers$/, ...err400('A valid email is required.') }, ...listMocks()],
    actions: [...openCreate, ...fillCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'A valid email is required.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 em Message error', selector: '.p-dialog .p-message-error', text: 'A valid email is required.' },
    ],
  })

const createValidation = (theme: Theme) =>
  flow(theme, 'customers-create-validation', 'Clientes — cadastrar vazio mostra validação', {
    actions: [...openCreate, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog .p-message', count: 1 }, { type: 'wait', ms: 300 }],
    renderChecks: [{ label: 'Mensagem de validação', selector: '.p-dialog .p-message-error', text: 'Nome completo e e-mail são obrigatórios.' }],
  })

const openEdit: ScenarioAction[] = [...openRowMenu(1), menuItem('Editar'), ...dialogOpen]

const editSuccess = (theme: Theme) =>
  flow(theme, 'customers-edit-success', 'Clientes — salvar edição (200) fecha, toast e recarrega', {
    mocks: [jsonMock(/\/api\/customers\/\d+$/, { ...figmaCustomers[0], fullName: 'Alice QA' }), listThen(figmaCustomers, withCustomer('Alice Johnson', { fullName: 'Alice QA' })), carsMock],
    actions: [...openEdit, { type: 'fill', selector: '#edit-customer-name', value: 'Alice QA' }, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Alice QA' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Diálogo fechado', selector: '.p-dialog', count: 0 },
      { label: 'Toast Cliente atualizado', selector: '.p-toast-message-success', text: 'Cliente atualizado' },
      { label: 'Tabela recarregada', selector: '.p-datatable-tbody > tr:first-child', text: 'Alice QA' },
    ],
  })

const editError = (theme: Theme) =>
  flow(theme, 'customers-edit-error-400', 'Clientes — salvar edição com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/customers\/\d+$/, ...err400('Car 999 does not exist.') }, ...listMocks()],
    actions: [...openEdit, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message', value: 'Car 999 does not exist.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 em Message error', selector: '.p-dialog .p-message-error', text: 'Car 999 does not exist.' },
    ],
  })

const editValidation = (theme: Theme) =>
  flow(theme, 'customers-edit-validation', 'Clientes — editar com nome vazio mostra validação', {
    actions: [...openEdit, { type: 'fill', selector: '#edit-customer-name', value: '' }, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog .p-message', count: 1 }, { type: 'wait', ms: 300 }],
    renderChecks: [{ label: 'Mensagem de validação', selector: '.p-dialog .p-message-error', text: 'Nome completo e e-mail são obrigatórios.' }],
  })

const detailsToEdit = (theme: Theme) =>
  flow(theme, 'customers-details-to-edit', 'Clientes — Editar nos detalhes fecha detalhes e abre edição', {
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog-header', value: 'Editar cliente' }, { type: 'wait', ms: 600 }],
    renderChecks: [
      { label: 'Só o diálogo de edição aberto', selector: '.p-dialog', count: 1 },
      { label: 'Título Editar cliente', selector: '.p-dialog-header', text: 'Editar cliente' },
      { label: 'Cliente carregado', selector: '#edit-customer-name', value: 'Alice Johnson' },
      noCloseFocus,
    ],
  })

const deleteSuccess = (theme: Theme) =>
  flow(theme, 'customers-delete-success', 'Clientes — excluir (204) fecha, toast e recarrega', {
    mocks: [{ urlPattern: /\/api\/customers\/\d+$/, status: 204, contentType: 'application/json', body: '' }, listThen(figmaCustomers, figmaCustomers.filter((c) => c.fullName !== 'Alice Johnson')), carsMock],
    actions: [...openRowMenu(1), menuItem('Excluir'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Bob Smith' }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Toast Cliente excluído', selector: '.p-toast-message-success', text: 'Cliente excluído' },
      { label: 'Alice removida após recarregar', selector: '.p-datatable-tbody > tr:has-text("Alice Johnson")', count: 0 },
      { label: 'Nenhuma linha presa no estado de saída', selector: '.p-datatable-tbody > tr.row-fx-leaving', count: 0 },
    ],
  })

const deleteError = (theme: Theme) =>
  flow(theme, 'customers-delete-error-400', 'Clientes — excluir com 400 mostra a mensagem da API', {
    mocks: [{ urlPattern: /\/api\/customers\/\d+$/, ...err400('Customer cannot be deleted.') }, ...listMocks()],
    actions: [...openRowMenu(1), menuItem('Excluir'), ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-text', selector: '.p-dialog .p-message-error >> nth=-1', value: 'Customer cannot be deleted.' }, { type: 'wait', ms: 300 }],
    renderChecks: [
      { label: 'Diálogo continua aberto', selector: '.p-dialog', count: 1 },
      { label: 'Mensagem 400 da API', selector: '.p-dialog .p-message-error:has-text("Customer cannot be deleted.")', count: 1 },
    ],
  })

const bulkSuccess = (theme: Theme) =>
  flow(theme, 'customers-bulk-delete-success', 'Clientes — excluir 2 selecionados (204) toast e recarrega', {
    mocks: [{ urlPattern: /\/api\/customers\/\d+$/, status: 204, contentType: 'application/json', body: '' }, listThen(figmaCustomers, figmaCustomers.filter((c) => !['Alice Johnson', 'Carol Williams'].includes(c.fullName))), carsMock],
    actions: [waitRows, selectRow(1), selectRow(3), { type: 'click', selector: bulkButton }, ...dialogOpen, { type: 'click', selector: footerPrimary }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'expect-text', selector: '.p-datatable-tbody > tr:first-child', value: 'Bob Smith' }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 400 }],
    renderChecks: [
      { label: 'Toast plural', selector: '.p-toast-message-success', text: '2 clientes excluídos' },
      { label: 'Seleção limpa', selector: '.p-datatable-tbody > tr[data-p-selected="true"]', count: 0 },
      { label: 'Carol removida', selector: '.p-datatable-tbody > tr:has-text("Carol Williams")', count: 0 },
    ],
  })

const escCloses = (theme: Theme) =>
  flow(theme, 'customers-esc-closes', 'Clientes — Esc fecha o diálogo de detalhes', {
    captureSelector: '#preview-root > div',
    actions: [...openRowMenu(1), menuItem('Detalhes'), ...dialogOpen, { type: 'press', selector: '.p-dialog', value: 'Escape' }, { type: 'expect-count', selector: '.p-dialog', count: 0 }, { type: 'hover', selector: 'h1' }, { type: 'wait', ms: 600 }],
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
  ...both(deleteDialog),
  ...both(bulkDialog),
  ...both(bulkOneDialog),
  ...both(deleteNoPhone),
  ...both(detailsEmpty),
  ...both(editNoCar),
  ...both(editClearCar),
  ...both(pagination),
  ...both(listError),
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
]
