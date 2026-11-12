import type { ScenarioAction, VisualScenario } from '../types'
import { DESKTOP, customers, jsonMock, pageWidth, pagedMock } from './fixtures'
import carOptionsJson from './fixtures/car-options.json' with { type: 'json' }

/**
 * Regression guard for the dialogs that keep the legacy shell (`dialogShellPt`, `dangerButtonClass`): Customers delete.
 * The Brands create/delete entries were removed when Brands moved to the Figma dialogs (see `brands-figma.ts`). `ConfirmDeleteDialog.vue` gained an opt-in list mode
 * and `FormField.vue` a `compact` prop, so these must render exactly as at the base commit.
 * Dialogs are teleported to <body>, so captures target the dialog root.
 */
type Theme = 'light' | 'dark'
const themeLabel = (theme: Theme) => (theme === 'light' ? 'claro' : 'escuro')
const waitRows: ScenarioAction = { type: 'expect-count', selector: '.p-datatable-tbody > tr', count: 10 }
const openDialog: ScenarioAction[] = [
  { type: 'expect-count', selector: '.p-dialog', count: 1 },
  { type: 'wait', ms: 300 },
]

function customerDelete(theme: Theme): VisualScenario {
  return {
    componentPath: 'Src/CarStore.Web/ClientApp/src/components/CustomersPage.vue',
    component: () => import('../../src/components/CustomersPage.vue'),
    route: { path: '/customers' },
    viewport: DESKTOP,
    mountWidth: pageWidth(DESKTOP.width),
    theme,
    locale: 'pt-BR',
    device: 'desktop',
    captureSelector: '.p-dialog',
    mocks: [pagedMock('/api/customers', customers, 10), jsonMock('/api/cars/options', carOptionsJson)],
    id: `customers-delete-dialog-${theme}`,
    label: `Clientes — Excluir cliente (ConfirmDeleteDialog legado), ${themeLabel(theme)}`,
    state: 'excluir cliente',
    actions: [
      waitRows,
      { type: 'click', selector: '.p-datatable-tbody > tr:first-child button[aria-label="Ações da linha"]' },
      { type: 'click', selector: '.p-menu-item:has-text("Excluir")' },
      ...openDialog,
    ],
    renderChecks: [{ label: 'Botão Excluir', selector: '.p-dialog button:has-text("Excluir")', count: 1 }],
  }
}

const both = (fn: (t: Theme) => VisualScenario) => [fn('light'), fn('dark')]

// Retired: Customers delete moved to the ConfirmDeleteDialog list mode (`customers-figma.ts`,
// `customers-delete-dialog-figma-*`); no dialog keeps the legacy shell any more.
void both
void customerDelete
export default [] as VisualScenario[]
