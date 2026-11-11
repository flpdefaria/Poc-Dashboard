# QA findings - Home dashboard (/) vs Figma "Tela · Central da frota"

Overall status: **FAIL** (Tentativa 03).

## Tentativa 01
- **Status:** BLOCKED.
- **Cause:** the Playwright MCP was configured with `--browser msedge`, and Edge is not installed. The exact error was: `Error: async initializeServer: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge. Run "npx playwright install msedge"`.
- **What did run:**
  - curl showed `<html lang="pt-BR">` and that `/api/cars`, `/api/brands` and `/api/customers` return 200.
  - Figma references were collected: [frame 2005:5266](references/figma-frame-2005-5266.png), [recent customers 2037:268](references/figma-recent-customers-2037-268.png), [nav rail 2005:5267](references/figma-navrail-2005-5267.png).
  - `get_metadata` was read for 2037:268.
- **Data changed:** none.

## Tentativa 02
- **Status:** BLOCKED.
- **Cause:** `.mcp.json` and `.vscode/mcp.json` already said `--browser chrome`, but this session was still connected to an old msedge server.
  - Stale msedge PIDs: 18299/18307, 7914/7915, 3108/3111, 90613/90614.
  - Chrome server PIDs: 33182/33183.
  - The error was the same as in Tentativa 01.
- **Data changed:** none.

## Tentativa 03

### status
**FAIL.** There are 2 medium and 3 low defects in the delivered scope, plus 3 low defects that existed before this delivery.

### ambiente
| Item | Value |
|---|---|
| App | http://localhost:5045 (dotnet, Development). The SPA is served from Vite at http://localhost:5173. Neither process was stopped. |
| HEAD | `bde82ae` |
| Rebuilt | No (dev mode uses Vite with HMR) |
| Browser | Playwright MCP 0.0.82, `--browser chrome`, DPR 1 |
| Figma | `EOvtzuJAvw1UnoH9tsYmiO`. Nodes read: 2005:5266, 2005:5267, 2037:268, 2007:102, 2007:127, 2008:3752, 2008:3755, 2008:3784 |
| PrimeVue MCP | Confirmed that the Tooltip directive shows on hover by default and only uses focus/blur when given the `.focus` modifier |

### Console errors
| # | Message | Repeats | Category | Severity | Likely file |
|---|---|---|---|---|---|
| C1 | `Failed to load resource: 404 @ http://localhost:5045/CarStore.Web.Web.styles.css` | Every full page load | defeito, pre-existing (path dates from commit `ebf0368`, Sep 2026) | low | `Src/CarStore.Web/Views/Shared/_Layout.cshtml:24`. The href doubles ".Web". The correct bundle `/CarStore.Web.styles.css` returns 200. `_Layout.cshtml.css` holds only a comment, so nothing changes visually. |
| C2 | `net::ERR_CONNECTION_REFUSED @ http://localhost:8400/live.js?token=…` | Every full page load | artefato-ferramenta | info | `_Layout.cshtml:40-42`. This is the "impeccable-live" dev injection, and its server on port 8400 is not running. Remove the block or start the tool. It is not an app defect. |

There were no other console errors or warnings. All `/api/*` calls succeeded (cars, brands, customers, brands/options, POST 201, DELETE 204).

### cenarios[]
| id | route / state | widths | themes | evidence |
|---|---|---|---|---|
| H1 | `/` default | 1440, 1920 | light, dark | evidence/H1-1440-light.png, H1-1440-dark.png, H1-1920-light.png, H1-1920-dark.png |
| H2 | Nav rail: hover-expand timing, leave, Esc, tooltips on hover and keyboard focus | 1440 | light, dark | evidence/H2-navrail-expanded-1440-light.png, H2-navrail-expanded-settled-1440-light.png, H2-navrail-expanded-1440-dark.png, H2-tooltip-keyboard-1440-light.png, H2-tooltip-focus-1440-light.png, H2-tooltip-hover-1440-dark.png |
| H3 | KPI fleet value tooltip on hover and focus | 1440 | light, dark | evidence/H3-kpi-tooltip-hover-1440-light.png, H3-kpi-tooltip-focus-1440-light.png, H3-kpi-tooltip-hover-1440-dark.png |
| H4 | Chart Semanal / Mensal / Anual | 1440 | light, dark | evidence/H4-chart-{semanal,mensal,anual}-1440-{light,dark}.png |
| H5 | "Clientes recentes": default, asc, desc, search, corners | 1440, 1920 | light, dark | evidence/H5-recent-{default,sort1,sort2,search}-1440-light.png, H5-recent-{default,sort1,sort2}-1440-dark.png, H5-recent-default-1920-{light,dark}.png, H5-corner-{bl,br}-1440-{light,dark}.png |
| P1 | `/cars`: table, row menu, Details, Edit, Create, Create validation | 1440 | light, dark | evidence/P1-table-1440-{light,dark}.png, P1-row-menu-1440-light.png, P1-details-dialog-1440-light.png, P1-edit-dialog-1440-light.png, P1-create-dialog-1440-{light,dark}.png, P1-create-validation-1440-light.png |
| P2 | `/brands`: table, Details, Create plus toast, delete blocked (brand has cars), delete confirm plus toast | 1440 | light, dark | evidence/P2-table-1440-{light,dark}.png, P2-details-dialog-1440-light.png, P2-create-dialog-filled-1440-light.png, P2-toast-create-1440-light.png, P2-delete-blocked-1440-light.png, P2-delete-confirm-1440-light.png, P2-toast-delete-1440-light.png |
| P3 | `/customers`: table, Edit, delete confirm | 1440 | light, dark | evidence/P3-table-1440-{light,dark}.png, P3-edit-dialog-1440-light.png, P3-delete-confirm-1440-{light,dark}.png |

### Requirement results
| # | Requirement | Result | Observed |
|---|---|---|---|
| 1a | Rail 72px; hover ~300ms expands to 240px as an overlay; collapses on leave | PASS | Width stayed 72 until about 267ms, started growing at about 319ms, reached 240 by 531ms. `main` stays at x=72 (overlay). Mouse leave collapses to 72. |
| 1b | Collapses on Esc | **FAIL (D2)** | Esc only works when focus is inside the rail |
| 1c | Collapsed tooltips on hover and keyboard focus | **FAIL (D1)** | Hover works ("Clientes", "Marcas"). Tabbing through Início, Carros, Marcas and Clientes shows no tooltip. |
| 1d | Selected item colours | PASS | Light: bg rgb(37,100,207) = #2564cf, white text. Dark: bg rgb(122,167,245) = #7aa7f5, text rgb(3,7,18). |
| 1e | `main p-10`; `#app` with no gap or p-4 | PASS | main class `flex-1 overflow-y-auto p-10`, padding 40px. `#app` is `flex h-full w-full` with padding 0. |
| 2 | Header "Central da frota" at weight 600 plus description | PASS | h1 24px/600, description matches Figma. The other pages' h1 is also 600. |
| 3a | Four KPI cards; compact value; tags | PASS | "R$ 20,8 mi", 538 (then 537), 15 "Ao vivo", 92% "Alta" |
| 3b | Full-value tooltip on hover or focus | **FAIL (D1)** | Hover shows "R$ 20.756.575,00". Keyboard focus (tabindex=0) shows no tooltip; only the aria-label carries the value. |
| 4a | Period SelectButton switches the chart; violet bars | PASS (visual mismatch in D3) | aria-pressed updates. Mensal shows 12 months, Anual 2021-2026. Semanal shows the pt-BR empty state "Nenhum cliente novo neste período." Bars are #6b3fe2. |
| 4b | Top 5 brands plus "Outros"; full-width "Ver marcas" at the bottom | PASS (sizing in D5) | Toyota, Ford, BMW, Honda, Audi, Outros (19/16/14/11/8/32%). Button is 362px wide. |
| 5a | 56px header; search 216×32, 6px radius, 12px icon, 12px text; "Ver todos" 32px and aligned | PASS | Header 56. Input 216×32, radius 6px, font 12px. Icon 12×12. "Ver todos" 103.6×32 at the same y (831.5). |
| 5b | 40px striped rows; no paginator; columns | Partial: **rows FAIL (D4)** | Rows are 41px, the rest passes. Striping alternates #fff / #f9fafb. No `.p-paginator`. Columns are Cliente, E-mail, Cadastrado em. |
| 5c | Only Cliente sortable; Lucide icon 12px at the right edge; ArrowUp/Down; `aria-sort` | PASS | `lucide-arrow-up-down size-3`, 14px from the right edge. Sorting switches to `arrow-up` / `arrow-down`. `aria-sort` goes none → ascending → descending, and keyboard Enter also sorts. Other headers are not sortable. |
| 5d | Bottom corners follow the 12px radius | PASS | Wrapper has `rounded-b-[11px] overflow-hidden` inside a 1px border; crops in both themes show no square corner. |
| 6 | pt-BR everywhere; `lang="pt-BR"` | PASS with 2 low pre-existing items (D7, D8) | Sidebar, pages, row menu (Detalhes/Editar/Excluir), Create/Edit/Details/Delete dialogs, validation messages, toasts and paginator aria-labels are all pt-BR. |
| 7a | Light and dark via the sidebar toggle; text contrast ≥ 4.5:1 | Dark PASS, **light FAIL (D3)** | Dark: lowest ratio 6.99:1 across 50 text nodes, and dialog text is all ≥ 4.5. Light: "Semanal"/"Anual" are at 4.39:1. |
| 7b | Primary buttons near-black in light, inverted in dark | PASS | Light: rgb(3,7,18) bg with white text. Dark: white bg with rgb(3,7,18) text. This holds for Ver marcas, Ver todos, Novo carro, Nova marca and Novo cliente. |
| 8 | Cars, Brands and Customers tables unchanged | PASS | PrimeVue `p-datatable-sort-icon` on every column. Search 280×42 at 16px. Wrapper `rounded-xl border border-surface-300 overflow-hidden` (12px). Rows 59px. Paginator present. No `pi-*` or `bi-*` icons. |

### diferencas[]
| id | status | severity | category | scenario / element | Figma or requirement | Observed | evidence | likely file |
|---|---|---|---|---|---|---|---|---|
| D1 | FAIL | **medium** | defeito (a11y) | H2/H3: collapsed rail items, Aparência, Tema escuro, KPI fleet value | Tooltip appears on hover **and keyboard focus** | Hover only. Tab focus shows no `.p-tooltip` for Início, Carros, Marcas, Clientes, or the "Valor da frota" value (tabindex=0). PrimeVue Tooltip uses hover unless given `.focus`, which then replaces hover; the fix needs both triggers. | evidence/H2-tooltip-keyboard-1440-light.png, evidence/H3-kpi-tooltip-focus-1440-light.png (focus, no tooltip), evidence/H3-kpi-tooltip-hover-1440-light.png (hover works) | `Sidebar.vue:84,99,113` (`v-tooltip.right`); `Home.vue:260` (`v-tooltip.top`) |
| D2 | FAIL | low | defeito | H2: rail expanded by hover, then Esc | Esc collapses the overlay | Rail stays 240px after Esc when focus is on the page. It only collapses (to 72) when focus is inside `<aside>`. | evidence/H2-navrail-expanded-1440-light.png | `Sidebar.vue:66` (`@keydown.esc` on the aside; needs a document-level listener while expanded) |
| D3 | FAIL | **medium** | defeito (contrast plus Figma parity) | H4: SelectButton "Período" | Figma 2008:3755 is 235×40: toggle padding 5px, label 14px/500, unselected #525252 on #fafafa (about 7.4:1) | 258.7×42, label 16px/500. Unselected rgb(107,114,128) on rgb(243,244,246) = **4.39:1**, below 4.5 in light. Dark passes. | evidence/H4-chart-mensal-1440-light.png, evidence/H1-1440-light.png | `Home.vue:282` (SelectButton: add small size or `pt` for 14px text and padding; unselected colour should be a stronger token such as `text-color` or surface-600) |
| D4 | FAIL | low | defeito | H5: thead and tbody rows | Rows 40px (Figma 2009:212 rows and header row are 40; card 1288×338) | Header and every body row are **41px** (`py-2.5` + 20px line + 1px border-bottom), so the card is 344 tall | evidence/H5-recent-default-1440-light.png, evidence/H5-recent-default-1920-light.png | `DataTableCommon.vue:59-64` `flushColumnPt` (e.g. `py-[9.5px]!`, or count the border in the 40px) |
| D5 | FAIL | low | defeito | H1: "Frota por marca" button and the middle row | Figma 2008:3784: button 362×**40** at y=387, a **24px** gap after the list, card height **446** | Button 362×**38** (`py-2`), gap list→button **16px** (from `mt-auto`), cards **436** tall. Together with D4 and the KPI delta, "Clientes recentes" starts at y=770.5 instead of 777. | evidence/H1-1440-light.png vs references/figma-frame-2005-5266.png | `buttonStyles.ts` (`buttonBaseClass` → 40px, e.g. `h-10`/`py-2.5`); `Home.vue:336` (minimum `mt-6` before the button) |
| D7 | FAIL | low | defeito, pre-existing | P2: Details "Data de fundação" | pt-BR date dd/MM/aaaa (the table shows 16/07/1909) | `1909-07-16` (ISO) | evidence/P2-details-dialog-1440-light.png | `components/common/dialog/DetailsBrandDialog.vue:16-18,54` (`formatIsoDate` slices ISO) |
| D8 | FAIL | low | defeito, pre-existing | P1-P3: `document.title` | Page title per route | Always "Início - Car Store" on /cars, /brands and /customers | snapshot data (no image) | `Views/Home/Index.cshtml:2` plus the router (no `document.title` update in ClientApp) |
| D9 | FAIL | low | defeito, pre-existing | Console C1 | No console errors | 404 for `CarStore.Web.Web.styles.css` | console log | `Views/Shared/_Layout.cshtml:24` |
| D10 | note | low | defeito, pre-existing, outside the brief | P2: search with no matches | Empty-state message | The table body is blank with no "Nenhum registro encontrado" | evidence/P2-toast-delete-1440-light.png | `DataTableCommon.vue` (no `#empty` / `emptyMessage`) |

### Classified, not failing
| id | category | item | evidence |
|---|---|---|---|
| N1 | decisao-design (flag for designer) | When sorted, the Cliente header takes the PrimeVue highlight: near-black fill with white text in light, white fill in dark. Figma draws no sorted state. It is visually heavy compared with the quiet header; consider a muted highlight in `flushColumnPt`. | evidence/H5-recent-sort2-1440-light.png, H5-recent-sort2-1440-dark.png |
| N2 | decisao-design | Logo is the animated car GIF (`/images/sidebar/minicar.gif`) instead of the blue Figma mark (vault note Sidebar-Logo-Icon). One expanded capture caught a near-blank GIF frame (artefato-ferramenta); the settled capture is fine. | evidence/H2-navrail-expanded-settled-1440-light.png |
| N3 | intencional | Extra "Aparência" (surface mode) rail button from commit 749c88b. Default `data-surface="gray"` gives text #374151 / #6b7280 where Figma's neutral palette uses #262626 / #737373. | evidence/H1-1440-light.png |
| N4 | conteudo-dinamico | Seed data differs from the Figma sample: names, 2 chart bars instead of 10, dates, stock 538→537 changed externally, avatar icon instead of "P". Count-up animation shows 0 / 0% for about 1s after load. English seed text (country "Germany", descriptions, body type "Coupe") is domain data. | evidence/H1-1440-light.png, H1-1920-light.png |
| N5 | known gap | No "Carro" column, so column widths differ from Figma (Cliente 332px vs 468px) | evidence/H5-recent-default-1440-light.png |
| N6 | known gap | Sorted by FullName (Alice…Eva), not by CreatedAt | same |
| N7 | known gap | Dark: flush rows rgb(3,7,18) / card tone alternate and look darker than the card | evidence/H5-recent-default-1440-dark.png, H5-corner-br-1440-dark.png |
| N8 | intencional | Deleting a brand that has cars is blocked in the UI: Excluir is disabled and a pt-BR explanation is shown, so the English domain error never surfaces | evidence/P2-delete-blocked-1440-light.png |

### minimas[]
| item | Figma | observed | rationale |
|---|---|---|---|
| KPI card height | 163 | 166.5 (tag is 20.5px tall vs about 17 in Figma: 11px label, 2/6 padding) | 3.5px; no effect on the outcome |
| KPI info tag tone | bg #cffafe / text #0e7490 | #e0f2fe / #0369a1 (PrimeVue "info" severity) | Same hue family, readable |
| Toast | (no Figma) | "Marca criada" / "Marca excluída", summary only | Text is pt-BR and correct |

### bloqueios
None. Every planned scenario ran.

### dados-alterados
- Created brand "QA Marca Teste" / Brasil / 01/01/2000 (POST /api/brands → 201, id 11), then deleted it (DELETE /api/brands/11 → 204). The seed is unchanged.
- Opened and cancelled the Edit and Create dialogs for cars and customers, and the delete confirmation for customer "Alice Johnson". Nothing was saved.
- Not caused by QA: "Carros em estoque" changed from 538 to 537 between captures.

### Known gaps (notes, not failures)
- No "Carro" column.
- "Clientes recentes" is sorted by FullName.
- Dark flush rows look darker than the card.
- Domain API error messages are in English.
