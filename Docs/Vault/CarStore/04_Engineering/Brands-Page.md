---
type: guide
created: 2026-11-12
updated: 2026-11-12
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
  - entity/brand
---

# Brands Page

The `/brands` screen (`BrandsPage.vue` + `BrandsTable.vue` and the Brand dialogs) matches the Figma canvas
**"🖥 Marcas"** (file `EOvtzuJAvw1UnoH9tsYmiO`, canvas `2121:4`). Frontend only: API, `BrandDto` and paging are
unchanged. It is built from the same shared pieces as [[Cars-Page]]; this note lists only what differs.

## Context

Second screen aligned to the Figma module after Cars. Copy is pt-BR (see [[UI-Language-pt-BR]]). The domain rule
"a brand with cars cannot be deleted" ([[Brand]]) is kept in the UI for single and bulk delete.

## Details

### Figma node -> code

| State | Frame | Key node | Code |
|---|---|---|---|
| List | `2113:4` | main `2113:6`, header `2113:7`, search `2113:9`, card `2113:10` | `BrandsPage.vue` (`gap-6`, "Nova marca" = `primaryButtonMdClass` + `Plus`), `BrandsTable.vue` (`DataTableCommon` `card` mode) |
| Row menu open | `2113:885` | menu `2113:893` | `DataTableCommon` card mode (no change) |
| Row selected | `2113:1744` | - | card mode + "Excluir selecionados (N)" |
| Details | `2113:2587` | `2113:2596` | `DetailsBrandDialog.vue` |
| Edit | `2113:3477` | `2113:3486` (datepicker `2114:4068`) | `EditBrandDialog.vue` |
| Create | `2113:4416` | `2113:4425` | `CreateBrandDialog.vue` |
| Bulk delete, blocked | `2113:5353` | `2113:5364` (warn `2113:5369`) | `ConfirmDeleteDialog.vue` list mode + `warning` |
| Delete single | `2113:6292` | `2114:4132` | `ConfirmDeleteDialog.vue` list mode |

### Table

- Columns: Nome, País, Fundação (plain 14px `formatDate`), Anos de atuação, Carros, all sortable, plus Ações.

### Dialogs

- All 400px, `modalDialogPt`, `modalDialogTitleClass`, `FormField compact`, Md button classes and the autofocus
  header pattern (no focus ring on the close button), same as Cars.
- Details: `Building` icon box, name, country (only when not empty); stats Fundação / Anos de atuação / Carros;
  "Carros da marca" list (model + muted year, "Nenhum carro cadastrado." when empty); Descrição ("Sem descrição."
  when empty); footer "Fechar" + "Editar" (emits `edit`; `BrandsTable.onDetailsEdit` opens the edit dialog).
- Create / edit: Nome, País, Data de fundação, Descrição. DatePicker uses `modalDatePickerPt` with
  `icon-display="input"` and an `#inputicon` slot rendering Lucide `Calendar` (`modalFieldIconProps`, calls
  `clickCallback`). Textarea: create 103px (`modalTextareaShortClass`), edit 124px (`modalTextareaClass`), as in
  Figma. Buttons "Cadastrar marca" / "Salvar alterações". Validation "Nome e data de fundação são obrigatórios." and
  API 400 in a `Message severity="error"`.
- Delete: title "Excluir {nome}?" / "Excluir N marca(s)?", "Esta ação não pode ser desfeita." banner, list rows
  (name, country, "N carros"), button "Excluir marca" / "Excluir N marca(s)" with `TrashIcon`.
- Blocked delete (brand has cars, single or bulk): the error banner is replaced by an orange warn banner
  (`warnBannerPt`), e.g. "{nome} tem N carros cadastrados. Remova ou transfira os carros antes de excluir a marca.",
  label "Marca(s) selecionada(s):", confirm disabled (PrimeVue 60% opacity).
- Copy for states without a Figma frame was approved by the user (2026-11-11): single-delete blocked, bulk not
  blocked ("As marcas serão removidas do cadastro:"), several blocked ("{A, B e C} têm carros cadastrados. …"),
  singular "tem 1 carro cadastrado", "Nenhum carro cadastrado.", "Sem descrição.".

### Shared pieces added or changed

- `ConfirmDeleteDialog.vue` list mode: a `warning` now shows `warnBannerPt` instead of the error banner. The legacy
  layout keeps its bottom warn Message. Only Brands passes `warning` in list mode.
- `style.css` warn-banner tokens (orange in both themes; dark approved by the user instead of Aura's yellow
  `--p-message-warn-*`):

| Token | Light (`@theme`) | Dark (`html.app-dark`) |
|---|---|---|
| `--color-warn-banner` | `--p-orange-50` at 95% | `--p-orange-400` 14% |
| `--color-warn-banner-border` | `--p-orange-200` | `--p-orange-400` 35% |
| `--color-warn-banner-ink` | `--p-orange-700` | `--p-orange-300` |

- `dialogStyles.ts`: `modalDatePickerPt` (40px input, `pe-[41.5px]`, icon `end-[17px]`), `modalFieldIconProps`
  (14px, 1.5px absolute stroke, muted; `modalSelectChevronProps` is now an alias), `modalTextareaShortClass` (103px).
- `buttonStyles.ts`: `dangerButtonMdClass` hover is `enabled:hover:` only (Cars delete no longer darkens while
  disabled/loading).
- Token mapping: Figma `message/warn/*` (orange) -> `--color-warn-banner*`; `iconfield/icon/color` #6b7280 ->
  `text-muted-color` (also the datepicker icon).

### Gaps

- Seed data and API 400 messages are English (backend).
- Search and sort act only on the loaded page; empty search shows a blank row (see [[Pagination]]).
- Not confirmed with the user yet: mixed bulk delete (one blocked, one not) reuses the singular blocked copy under
  "Marcas selecionadas:"; form error Messages use Aura's default (no Figma frame), as on Cars.

### QA

Evidence: `qa-results/2026-11-12T12-28-49-990Z-multi-component/findings.md` (PASS, first exhaustive pass, no
defects; Cars/Customers/Home unchanged vs base). Scenarios in `visual/scenarios/brands-figma.ts`, see
[[Visual-QA-Harness]].

## Related

- [[Cars-Page]]
- [[Frontend-SPA]]
- [[Brand]]
- [[Pagination]]
- [[Theme-Surface-Modes]]
- [[Visual-QA-Harness]]
- [[UI-Language-pt-BR]]
