---
type: guide
created: 2026-09-18
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# Home Dashboard

`Home.vue` (route `/`) is a small analytics dashboard built only from the existing `/api/cars`, `/api/brands`,
`/api/customers` endpoints. No fabricated metrics, deltas, or history.

On 2026-11-10 it was refactored to match the Figma frame **"Tela · Central da frota"** (file
`EOvtzuJAvw1UnoH9tsYmiO`, node `2005:5266`), replacing the earlier version derived from file
`2zyEr3S75NxHIJ5vgTFCWR` (node `217:6263`). Copy is in Portuguese, like the rest of the app (see [[UI-Language-pt-BR]]).

## Figma node -> code

| Figma node | Code (`Src/CarStore.Web/ClientApp/src/components/Home.vue`) |
|---|---|
| `2005:5302` page-header | Shared `common/pageheader/PageHeader.vue` ("Central da frota" + description) |
| `2007:102` kpis (4 x `_kpi-card`) | `Card` x4 rendered from a `kpis` computed; `panelPt` (12px radius, `border-surface-200`, 18px body); value `text-[48px] font-semibold leading-14 tracking-[-0.96px]`; icon box `bg-surface-100 p-2 rounded-md` |
| `2007:103` annotation (compact value + full-value tooltip) | `formatCurrencyCompact` ("R$ 20,8 mi") + PrimeVue `v-tooltip.top` with `formatCurrency` |
| `2008:3752` new-customers | `Card` + `SelectButton` (Semanal/Mensal/Anual) + `common/chart/BarChart.vue` at 332px, `--color-paint-violet` |
| `2008:3784` fleet-by-brand | Top 5 brands + "Outros" row, 8px databars (`bg-surface-200` track), `primaryButtonClass` "Ver marcas" |
| `2037:268` / `2009:212` recent-customers | `Card` (body `p-0`) wrapping `DataTableCommon` with `flush`, `striped-rows`, `:paginator="false"`, `#toolbar` "Ver todos" (`primarySmallButtonClass`, Figma `button-small` `2009:385`); only "Cliente" is sortable |
| `2005:5267` nav-rail, `2005:5301` 40px margin | App shell, see [[Sidebar-Collapse-Expand]] |

## Behavior

- **KPIs:** fleet value (`price * stock`), cars in stock, registered customers (`totalItems` of the paged
  customers call, tag "Ao vivo"), availability rate (tag "Alta" >= 50%, else "Baixa").
- **New customers:** trailing, zero-filled windows from `CustomerDto.createdAt`: 12 months ending this month
  (pt-BR short month labels), 12 weeks (Monday starts, `dd/MM`), or every year from the first customer to now.
  An all-zero window shows "Nenhum cliente novo neste período." This replaced the earlier grouping by month
  name, which merged different years.
- **Recent customers:** first server page (5 rows) of `/api/customers`; no paginator, "Ver todos" links to
  `/customers`. Search/sort only act on that page (see `DataTableCommon`).
- Showroom loader, staggered `.reveal` entrance, count-up numbers and `.bar-fill` animations are kept; the old
  word-by-word headline animation and its CSS were removed.
- `PoweredByBadge` and the "Manage fleet" footer CTA were removed from Home (not in the frame); the component
  file is kept.

## Shared pieces added or changed

- `src/style.css` `@theme`: new data swatches `--color-paint-violet` (`#6b3fe2`), `--color-paint-rust`
  (`#c14624`), `--color-paint-teal` (`#05817c`) with lifted `html.app-dark` variants. Figma `#a07307` -> existing
  `paint-bronze`, `#8a3658` -> `paint-burgundy`, gray "Outros" -> `paint-graphite`.
- Figma colors (corrected 2026-11-11). The frame resolves to the **gray** surface mode: `get_variable_defs` on
  2005:5301 returns text `#1f2937`, muted `#6b7280`, border `#e5e7eb`, sunken `#f9fafb` and contrast
  `#030712`. The neutral hexes in `get_design_context` code (`#262626`, `#737373`…) are only variable
  fallbacks. Mapping:
  - `text-color` = surface-800 (preset `text.color`)
  - `text-muted-color` = surface-500
  - borders and databar track: `surface-200`
  - KPI icon box: `bg-sunken` (new token)
  - contrast button: `bg-primary` (`primary.950`)
  - "Outros" databar: `bg-surface-500`
- `styles/buttonStyles.ts` (2026-11-11, app-wide): `primaryButtonClass` now uses `bg-primary`,
  `border-primary`, `text-primary-contrast`, `hover:bg-primary-emphasis` (near-black in light, white end of the
  inverted ramp in dark) instead of `surface-700`. New `primarySmallButtonClass` (`h-8` = 32px, `py-0`, `text-xs`, `px-[13px]`), the same height as the flush search box.
- Home "Clientes recentes" header is `p-4` (Figma 56px header) and the card content has no gap.
- `common/pageheader/PageHeader.vue` (app-wide): title `font-semibold` (Figma 600) instead of `font-black`. On
  2026-11-11 its actions moved beside the heading block, vertically centered (see [[Cars-Page]]).
- KPI `tagPt` now lives in `styles/tagStyles.ts` (shared with the Cars table and details dialog).
- `utils/format.ts`: `formatCurrencyCompact` (pt-BR compact BRL).
- `common/chart/BarChart.vue`: optional `height` (px, default 160) and `ariaLabel` props, `minInterval: 1`,
  24px square bars, tight grid.
- `common/table/DataTableCommon.vue`: optional `searchPlaceholder`, `paginator` (default `true`),
  `stripedRows`, `flush` (no outer border; 40px toolbar `min-h-10 px-4 py-1` with no gap above the table;
  Figma search box `I2009:212;553:9756;2009:398` at 216x32: `flushSearchInputClass` = `h-8 rounded-md py-0
  ps-[32.75px] pe-3 text-xs leading-[18px] not-focus:border-surface-400`, `flushSearchIconClass` = 12px icon at
  `start-[13px]`; 40px rows; header title `flex-1` with a `#sorticon` slot: Lucide `ArrowUpDown` 12px,
  `absolute-stroke-width` 1.5, `text-muted-color` (Figma sortIcon `#6b7280`) when unsorted, `ArrowUp`/`ArrowDown`
  (inheriting the sorted header colour) for asc/desc, which Figma does not draw; `rounded-b-[11px]`
  `overflow-hidden` wrapper so the last striped row follows the card's 12px corner inside its 1px border; the
  row `Menu` is appended to `<body>`, so it is not clipped) and a `#toolbar` slot;
  `DataTableColumn.sortable` (default `true`) makes sorting per column. The defaults leave the
  Cars/Brands/Customers tables unchanged.

## Figma parity details

Evidence: `qa-results/2026-11-11T12-39-34-926Z-home` (PASS; spec 140/140; whole screen 1288x1075, the 1.03% pixel
diff is Inter rasterization plus 4 fixture dates).

| Area | Change |
|---|---|
| Card titles | `text-lg leading-6`, 18/24 (Figma heading/sm) |
| SelectButton | 40px with 14px/21px labels (`periodSelectPt` + preset `togglebutton` tokens) |
| KPI tags | 17px (`leading-[13px]`), cyan info tone |
| "Ver marcas" | `mt-6` gap; 40px button with `px-4` and a 16px icon |
| Recent table | rows 40px including the border (`flush` `py-[9.5px]`), fixed layout at 3:1:3:1 |
| "Carro" column | `CustomerDto.carName` (see [[Customer]]); a car-less customer shows "—" |
| Digits | No `tabular-nums` on KPI values, percentages or dates: Figma draws proportional digits |
| Chart | Inter 12px axis labels, axis surface-400, grid surface-200, 2px bar radius |

## Known gaps
- "Clientes recentes" lists the first page ordered by `FullName` (`CustomerService`), not by `CreatedAt`.
- Aggregates use `pageSize=100` loads, so they undercount past 100 rows.

## Related

- [[Cars-Page]]
- [[Customer]]
- [[Visual-QA-Harness]]
- [[Frontend-SPA]]
- [[Pagination]]
