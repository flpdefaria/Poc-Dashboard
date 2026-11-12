---
type: guide
created: 2026-11-11
updated: 2026-11-12
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# Cars Page

The `/cars` screen (`CarsPage.vue` + `CarsTable.vue` and the Car dialogs) was refactored on 2026-11-11 to match
the Figma page **"🖥 Carros"** (file `EOvtzuJAvw1UnoH9tsYmiO`, canvas `2079:3816`). Frontend only: the API, DTOs
and paging are unchanged. Copy is in Portuguese (see [[UI-Language-pt-BR]]).

## Figma node -> code

| Figma frame / node | Code |
|---|---|
| `2063:4` "Tela · Carros", main `2063:6` (24px gap) | `components/CarsPage.vue` (`flex-col gap-6`) |
| page-header `2063:7` (title-row `I2063:7;363:2790`) | `common/pageheader/PageHeader.vue`: heading block and actions side by side, vertically centered (app-wide) |
| "Novo carro" button `I2063:7;363:2756;2064:7078` | `primaryButtonMdClass` + Lucide `Plus` in the `#icon` slot |
| content `2066:560` = search `2066:561` + card `2064:7106` (table `2064:7107`) | `common/table/DataTableCommon.vue` with the new `card` prop, used by `CarsTable.vue` |
| "Menu de ações aberto" `2069:2759`, menu `2069:3601`, open-row trigger `…;2069:2779;…;2069:2843` | `cardMenuPt`, `onMenuShow`, `cardMenuTriggerClass`, `cardMenuOpenRowClass` in `DataTableCommon.vue` |
| paginator `I2069:2766;553:9905;2069:3083`, rows-per-page select `…;394:18797` | `cardPaginatorPt` / `cardNavButtonPt` / `cardNavIconPt` in `DataTableCommon.vue` |
| "Linha selecionada" `2070:1090`, bulk button `2070:1925` | `cardBodyRowPt` (selected tint) + "Excluir selecionados (N)" outlined danger button |
| "Confirmar exclusão" `2071:1663`, delete-dialog `2072:2729` | `common/dialog/ConfirmDeleteDialog.vue` with the new `items` / `confirmLabel` props |
| "Detalhes" `2073:3479`, details-dialog `2074:3769` | `common/dialog/DetailsCarDialog.vue` (rewritten; emits `edit`) |
| "Editar carro" `2073:3806` / "Novo carro" `2073:4133`, form-dialog `2075:4909` / `2075:5049` | `EditCarDialog.vue` / `CreateCarDialog.vue` |

## Table (`DataTableCommon` `card` mode)

- Opt-in: used by Cars and Brands ([[Brands-Page]]); Customers and Home keep their current table. Do not combine `card` with `flush`.
- Search box 216x40 above the card (16px gap); card `rounded-xl border-surface-200 shadow-sm`. Search icon 14px
  in `text-muted-color!` (Figma `iconfield/icon/color` #6b7280; Aura's `--p-iconfield-icon-color` is surface-400)
  with a 1.5px absolute stroke (`cardSearchIconProps`, card only).
- 48px header and body rows including the 1px border: cells `px-[18px] py-[13.5px]`; the actions cell uses
  `py-[7.5px]` for its 32px icon button. Checkbox column 56px, actions column 80px, data columns equal (fixed layout).
- Every body cell is 14px and inherits the row ink (no muted/xs secondary columns, no bold "Modelo").
- Selected row and active page: Figma's blue pair #d7e6fe / #1046a0 through the `--color-selected` /
  `--color-selected-ink` tokens in `style.css` (`bg-selected!` / `text-selected-ink!`), lifted for dark theme.
- Checkbox (card only, `.dt-card` rules in `style.css`): 18x18, 4px radius, unchecked border `--p-surface-400`
  (#9ca3af) with no shadow, 12px check icon, checked fill/border `--color-selected-accent` (#2564cf; #7aa7f5 in
  dark). Aura's hover and focus-visible rules are more specific and still apply (keyboard focus ring kept).
- "Excluir selecionados (N)": `cardBulkButtonClass` forces the ink to `--p-red-700` (#b91c1c, Figma
  `button/outlined/danger/color`) and `--p-red-300` under `html.app-dark`; Aura's #fecaca border already matched.
- Paginator centered, 36px round buttons (`size-9! min-w-9!`), 4px gap, 14px vertical padding (68px footer, 598px
  card), no bottom border. Nav glyphs are PrimeVue's built-in angle SVGs (the Figma file uses the same PrimeOne
  `angle-*` icons, not Lucide), sized 14px through the `firstIcon`/`prevIcon`/`nextIcon`/`lastIcon` pt sections.
  Idle pages 14px regular muted; the current page is semibold on `--color-selected` / `--color-selected-ink`
  (Figma `paginator/nav/button/selected` #d7e6fe / #1046a0). Hover only on idle pages; disabled nav buttons keep
  Aura's 0.6 opacity (no Figma disabled state). Rows-per-page select 40px, `leading-[38px]!` label in
  `text-muted-color` (Figma `select/placeholder/color`), 14px dropdown chevron, surface-400 border.
- Row menu 175px, 6px radius, 30px items (`px-3! py-2!`, 8px icon gap), 4px item gap, 3px list padding (106px
  menu, because Figma's stroke sits outside auto layout), 14px `text-muted-color` icons with an absolute 1.5px
  stroke, all labels `text-color` ("Excluir" is not red in Figma), no separators, `shadow-md` (= Figma
  `menu/shadow`). "Excluir" uses `TrashIcon` in card mode (Figma `trash`, no inner lines); other tables keep Lucide `Trash2`. Icons pass
  `size` (14, ellipsis 16) because `absoluteStrokeWidth` scales by the `size` prop, not the CSS size. The icon classes are applied on the `#itemicon` slot's `<component>` in card mode, because PrimeVue
  passes only `cx('itemIcon')` to that slot and `cardMenuPt.itemIcon` alone never applies.
- Menu placement (card only): `onMenuShow` runs after PrimeVue's `absolutePosition` and puts the menu's right edge
  on the trigger's right edge with a 4px gap (`cardMenuGap`), keeping PrimeVue's upward flip near the viewport
  bottom. PrimeVue alone left-aligns with a 2px gutter. Coordinates are whole pixels and the trigger sits on a half
  pixel (7.5px cell inset), so an exact 4px gap is impossible: below = round(bottom + 4) -> 4.5px (as in the frame);
  above = floor(top) - 4 - height -> 4.5px (it was round(...) -> 3.5px).
- Open state (card only): `menuRowKey` tracks the row whose menu is open (cleared on Menu `hide`). That row gets the
  `--p-datatable-row-hover-background` fill unless selected (selection dominates), and its trigger keeps
  `bg-surface-50!` and `aria-expanded`. Trigger glyph `text-surface-900!` (Figma #111827), 16px, 1.5px stroke.
- "Disponível" uses `Tag` with the shared `tagPt` (`styles/tagStyles.ts`).

## Dialogs

- Initial focus: PrimeVue Dialog focuses (focus-visible) the close button unless something has `[autofocus]`, and
  Figma draws no ring. Each Car dialog (create, edit, details, delete list mode) puts `autofocus tabindex="-1"
  class="outline-none"` on its `#header` title element (details: the header block). PrimeVue's `focus()` searches
  the header container before falling back to the close button. The title was chosen over a content wrapper so the
  content DOM (and the QA selectors such as `.p-dialog-content > section`) stays unchanged. Tab reaches the close
  button and the fields; Esc still closes. Brands dialogs use the same pattern ([[Brands-Page]]); Customers dialogs are untouched.
- Shell: `modalDialogPt(width)` in `common/dialog/dialogStyles.ts` (12px radius, surface-200 border, shadow-xl,
  18px header/content/footer insets, 16px content gap, 6px footer gap, 32px close button). Close glyph = Lucide `X`
  in the Dialog `#closeicon` slot. Title class `modalDialogTitleClass` (18/24, 600). All Car dialogs are 400px.
- Form controls: `modalInputClass`, `modalInputNumberPt`, `modalSelectPt`, `modalTextareaClass` (40px, 14px text,
  124px textarea, surface-400 border except while focused). The Select label is centered with `leading-[38px]!`
  (40px minus the borders), because `.p-select-label { display: block }` ignores flex centering. Its chevron is
  `dropdownIcon: size-3.5! text-muted-color!` (Figma 14px #6b7280; Aura 16px surface-400). `FormField.vue` gained optional `compact` (12/16 medium label, 8px gap) and `inputId` (`for`).
- Form layout: Modelo; Chassi (VIN); Marca + Carroceria; Ano do modelo + Quilometragem; Preço + Estoque; Descrição.
  Create shows the Figma placeholders and "Cadastrar carro"; edit shows "Salvar alterações" and keeps Quilometragem
  disabled (as before). Validation ("Modelo e marca são obrigatórios.") and API `400 { message }` errors still show
  in a `Message severity="error"`.
- Delete: title "Excluir carro?" / "Excluir N carros?", error banner "Esta ação não pode ser desfeita." (`bannerPt`
  in `ConfirmDeleteDialog.vue`, node `2072:2739`: 33px, real 1px `--p-message-error-border-color` border instead of
  Aura's outline, 6x10px padding, 16/19 text, `--p-red-700` ink in light and the dark message token under
  `html.app-dark`), list rows
  (model, "Marca · Carroceria", price), danger button "Excluir carro" / "Excluir N carros" with `TrashIcon`. Without
  `items` the dialog keeps its legacy layout (Customers). With `items` + `warning`, a warn banner replaces the error banner (Brands, see [[Brands-Page]]).
- Details: header icon box (`bg-sunken`, Lucide `Car`), model + "Disponível"/"Indisponível" tag, "Marca ·
  Carroceria"; price at 32/40; sunken stats (Estoque "N un.", Quilometragem, Ano do modelo); Especificações
  (Marca, Carroceria, Chassi in `font-mono`); Descrição ("Sem descrição." when empty); footer "Fechar" + "Editar"
  (closes details and opens the edit dialog via `useEntityCrud.onEditRequest`).

## Shared pieces added

- `styles/buttonStyles.ts`: `primaryButtonMdClass`, `secondaryButtonMdClass`, `dangerButtonMdClass` (Figma
  "button" default: 40px, `px-4`, 14/21 label, 8px gap, 16px icon). `dangerButtonMdClass` (Cars delete dialog only)
  fills with `--p-red-600` (#dc2626), hover `--p-red-700`. Use the PrimeVue `--p-red-*` vars, not Tailwind v4's
  `red-*` utilities: Tailwind v4's oklch reds do not match the Aura/Figma hex values. The older 38px classes are
  unchanged.
- `components/common/icons/TrashIcon.vue`: Lucide trash-2 minus the `M10 11v6` / `M14 11v6` paths, rendered
  through `@lucide/vue`'s `Icon` (`name="trash"`), so it keeps the `.lucide` class and the `size` / `strokeWidth` /
  `absoluteStrokeWidth` / `class` API. Used by the card row menu, the card bulk button and the list-mode delete
  button only.
- `styles/tagStyles.ts`: `tagPt` (moved from `Home.vue`, same classes; Home now imports it).
- Token mapping (frame resolves to the gray surface mode, as on Home): text `#1f2937` -> `text-color`, muted
  `#6b7280` -> `text-muted-color`, borders `#e5e7eb` -> `surface-200`, input/select/outlined borders `#9ca3af` ->
  `surface-400` (forced by the classes; the preset/Aura default input border is surface-300), contrast `#030712` -> `bg-primary`, card shadow -> `shadow-sm`, modal shadow -> `shadow-xl`,
  menu shadow -> `shadow-md`, sunken `#f9fafb` -> `bg-sunken`. Second pass: `paginator/nav/button/selected`
  #d7e6fe / #1046a0 -> `--color-selected` / `--color-selected-ink` (style.css, exact hex); `button/text/secondary/hover/background` #f9fafb
  -> `bg-surface-50`; `button/text/secondary/color` #111827 -> `text-surface-900`; table row hover #f3f4f6 ->
  `--p-datatable-row-hover-background`; `iconfield/icon/color` #6b7280 -> `text-muted-color`.

## Figma alignment policy

No deviations from the frame are approved (2026-11-11). The former list (selection color, bulk button ink,
checkbox size, trash glyph, VIN font) was fixed in the strict QA pass (see History). The upward menu gap is 4.5px (whole pixels,
same as the downward gap and Figma's own rounding), approved by the user.

## Gaps

- No API gaps: every field shown comes from `CarDto`. "N un." and "Brand · Body" are client formatting.
- Search and column sort still act only on the loaded page (see [[Pagination]]). A search with no result shows a
  blank row: `DataTableCommon` has no `#empty` slot.
- API 400 messages come from English `DomainException` texts (e.g. `Car.cs`), so the pt-BR UI shows English (backend).
- The table has no accessible name (`aria-label`), which the Figma table component asks for.
- The Figma inputtext main component (`2004:11640`) is not readable through the MCP, so filled/hover/focus states keep
  Aura's (text surface-700, hover border surface-400, focus border primary).
- **VIN font (resolved):** Figma `code/sm` is Roboto Mono 12/16. It is self-hosted like Inter (no CDN):
  `@fontsource/roboto-mono` dependency, `@import "@fontsource/roboto-mono/latin-400.css"` in `style.css`, and
  `--font-mono` in `@theme` starts with "Roboto Mono". The VIN is the only `font-mono` use in the app.

## PrimeVue override rule (`!`)

PrimeVue's component CSS is injected at runtime outside Tailwind's CSS layers, so it beats any layered
utility of equal specificity. Every Tailwind class in a `pt`/`class` that must override a property the
PrimeVue theme also sets (padding, gap, min-width/height, border/outline color, icon color, `display`) needs
the `!` suffix (`p-[18px]!`, `min-w-[175px]!`, `text-muted-color!`). Classes without `!` only work for
properties the theme leaves unset. `display: block` on `.p-select-label` is why labels are centered with a
line-height instead of `flex`.

## Decisions

- Paginator: no `#paginatorcontainer` or separate paginator component. The DataTable renders its own Paginator, and
  the pt sections plus PrimeVue's built-in angle icons already match Figma.
- A PrimeVue slot can drop a `pt` class silently (Menu `#itemicon`): put the classes on the slot content itself.

## History

Refactor and QA rounds (first pass, menu + paginator pass, content re-read, strict third pass) are in git history.
Final evidence: `qa-results/2026-11-11T21-59-27-336Z-cars-page/findings.md` (attempt 04, PASS).

## Related

- [[Brands-Page]]
- [[Home-Dashboard]]
- [[Frontend-SPA]]
- [[Pagination]]
- [[Theme-Surface-Modes]]
- [[Visual-QA-Harness]]
- [[Car]]
