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
- Figma neutrals: `#e5e5e5` -> `border-surface-200` / `bg-surface-200`, `#262626` -> `text-color`,
  `#737373` -> `text-muted-color`, sunken `#fafafa` -> `bg-surface-100`, contrast button `#0a0a0a` ->
  `bg-primary`/`text-primary-contrast` (the preset's monochrome `primary.950`), used by `primaryButtonClass`.
- `styles/buttonStyles.ts` (2026-11-11, app-wide): `primaryButtonClass` now uses `bg-primary`,
  `border-primary`, `text-primary-contrast`, `hover:bg-primary-emphasis` (near-black in light, white end of the
  inverted ramp in dark) instead of `surface-700`. New `primarySmallButtonClass` (32px, `text-xs`, `px-[13px]`).
- `common/pageheader/PageHeader.vue` (app-wide): title `font-semibold` (Figma 600) instead of `font-black`.
- `utils/format.ts`: `formatCurrencyCompact` (pt-BR compact BRL).
- `common/chart/BarChart.vue`: optional `height` (px, default 160) and `ariaLabel` props, `minInterval: 1`,
  24px square bars, tight grid.
- `common/table/DataTableCommon.vue`: optional `searchPlaceholder`, `paginator` (default `true`),
  `stripedRows`, `flush` (no outer border, padded toolbar, small 216px search, 40px rows) and a `#toolbar` slot;
  `DataTableColumn.sortable` (default `true`) makes sorting per column. The defaults leave the
  Cars/Brands/Customers tables unchanged.

## Known gaps

- Figma column "Carro" has no data source: `CustomerDto` has no car. It is omitted.
- "Clientes recentes" lists the first page ordered by `FullName` (`CustomerService`), not by `CreatedAt`.
- Aggregates use `pageSize=100` loads, so they undercount past 100 rows.

## Related

- [[Frontend-SPA]]
- [[Pagination]]
