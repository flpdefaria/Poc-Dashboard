---
type: guide
created: 2026-11-12
updated: 2026-11-12
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
  - entity/customer
---

# Customers Page

The `/customers` screen (`CustomersPage.vue` + `CustomersTable.vue` and the Customer dialogs) matches the Figma canvas
**"🖥 Clientes"** (file `EOvtzuJAvw1UnoH9tsYmiO`, canvas `2138:4`). Frontend only: API, `CustomerDto` and paging are
unchanged. It is built from the same shared pieces as [[Cars-Page]] and [[Brands-Page]]; this note lists only what
differs.

## Context

Third screen aligned to the Figma module, after Cars and Brands. Copy is pt-BR (see [[UI-Language-pt-BR]]). The
optional car link ([[Customer]]) is kept in create/edit as a "Carro" Select.

## Details

### Figma node -> code

| State | Frame | Key node | Code |
|---|---|---|---|
| List | `2134:4` | main `2134:6`, header `2134:7`, search `2134:9`, card `2134:10` | `CustomersPage.vue` (`gap-6`, "Novo cliente" = `primaryButtonMdClass` + `Plus`), `CustomersTable.vue` (`DataTableCommon` `card` mode) |
| Row menu open | `2134:269` | menu `2134:277` | `DataTableCommon` card mode (no change) |
| Row selected | `2134:535` | `2134:537` | card mode + "Excluir selecionados (N)" |
| Details | `2134:802` | `2134:811` | `DetailsCustomerDialog.vue` |
| Edit | `2134:1106` | `2134:1115` (select `2135:2862`) | `EditCustomerDialog.vue` |
| Create | `2134:1392` | `2134:1401` | `CreateCustomerDialog.vue` |
| Delete single | `2134:1678` | `2134:1687` | `ConfirmDeleteDialog.vue` list mode |

### Table

- Columns: Nome completo, E-mail, Telefone, Cadastrado em (plain 14px `text-color` date), all sortable, plus Ações.
- Null phone shows "—".

### Dialogs

- All 400px, `modalDialogPt`, `modalDialogTitleClass`, `FormField compact`, Md button classes and the autofocus
  header pattern, same as Cars and Brands.
- Details: `IdCard` icon box (20px, sunken), full name, "Cliente desde {dd/mm/aaaa}"; "Informações" section with
  E-mail, Telefone, Carro (`carName`), "—" when null; footer "Fechar" + "Editar" (emits `edit`;
  `CustomersTable.onDetailsEdit` opens the edit dialog).
- Create / edit: Nome completo, E-mail (`type="email"`), Telefone (`type="tel"`), Carro. Placeholders "Ex.: Maria
  Silva", "nome@email.com", "(00) 00000-0000", "Sem carro" (edit reuses them). Buttons "Cadastrar cliente" /
  "Salvar alterações". Validation and API 400 in a `Message severity="error"`.
- Carro Select: `modalSelectPt` + `#dropdownicon` `ChevronDown`, `filter` and `show-clear` with Lucide slots
  `#clearicon` (`X`, keeps class `p-select-clear-icon` for QA selectors) and `#filtericon` (`Search`), both
  `modalFieldIconProps`. Filter copy "Buscar carro" / "Nenhum carro encontrado".
- Delete: title "Excluir {nome}?" / "Excluir N clientes?" ("Excluir 1 cliente?"), "Esta ação não pode ser desfeita."
  banner, "O cliente será removido do cadastro:" / "Os clientes serão removidos do cadastro:", list rows (name, email
  as subtitle, phone as meta), button "Excluir cliente" / "Excluir N clientes" with `TrashIcon`.

### Shared pieces

- No new tokens or helpers. Token mapping as Cars/Brands (gray surface mode): muted #6b7280 -> `text-muted-color`,
  border #e5e7eb -> `border-surface-200`, input border #9ca3af -> `surface-400`.
- `ConfirmDeleteDialog.vue`: Cars, Brands and Customers now all use list mode; the legacy label/value layout has no
  consumer (kept, not removed).

### Gaps (not approved by the user yet)

- Edit frame does not draw the Select clear X (shown only when a car is selected); kept because `show-clear` was
  required. Filter icon/overlay and filter copy have no frame.
- Details `IdCard` glyph: Figma uses the old Lucide drawing, `@lucide/vue` 1.71 ships the new one (QA minima).
- No frame for: bulk delete copy, details without phone/car ("—"), delete row without phone (empty meta, while table
  and details show "—"), edit placeholders, validation/400 Messages (Aura default, as Cars/Brands).
- Seed data and API 400 messages are English (backend).

### QA

Evidence: `qa-results/2026-11-12T15-51-34-109Z-customers-page/findings.md` (PASS, attempt-04; 60 scenarios, only text
anti-aliasing minimas). Regression run `qa-results/2026-11-12T16-00-40-872Z-multi-component` (Cars, Brands, Home:
0px diff). Scenarios in `visual/scenarios/customers-figma.ts`, see [[Visual-QA-Harness]].

## Related

- [[Cars-Page]]
- [[Brands-Page]]
- [[Customer]]
- [[Frontend-SPA]]
- [[Pagination]]
- [[Theme-Surface-Modes]]
- [[Visual-QA-Harness]]
- [[UI-Language-pt-BR]]
