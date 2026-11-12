---
applyTo: "Src/CarStore.Web/ClientApp/**,Src/CarStore.Web/wwwroot/dist/**"
---

# Front-end instructions (Vue 3 + PrimeVue + Tailwind v4)

Rules for humans and coding agents working inside `Src/CarStore.Web/ClientApp/`. Serving/API contract:
`web.instructions.md`. Background (theme internals, app bootstrap, setup, porting to another project):
`reference/frontend-reference.md`, read only when the task touches it.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Vue 3.5 SFC, `<script setup lang="ts">` | SPA with `vue-router` (history mode). No Pinia. |
| Build | Vite 8 (Rolldown) + `@vitejs/plugin-vue` 6 | Output `../wwwroot/dist`. |
| UI kit | PrimeVue 4 + `@primeuix/themes` 1 (`CarStorePreset` on Aura, `src/plugins/primevue-preset.ts`) | `darkModeSelector: false` **on purpose**: dark = inverted surface scale under `html.app-dark`. |
| Icons | `@lucide/vue` | `import { Plus } from "@lucide/vue"` → `<Plus />`; sized `1em` by `.lucide` in `style.css` (a `text-*`/`size-*` class sets it). In PrimeVue use the `#icon` / `#itemicon` / `InputIcon` slot, never the string `icon` prop. Never `pi pi-*`, `bi-*` or raw SVG when a Lucide icon exists. |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) + `tailwindcss-primeui` | CSS-first: **no `tailwind.config.js`**. |
| Types | TypeScript 6 strict, `vue-tsc` 3 | Do not upgrade to TS 7 (unsupported by `vue-tsc`). |
| Bootstrap / jQuery | **Removed** | Never reintroduce. |
| Charts | ECharts 6 tree-shaken (`echarts/core`) | Only via `components/common/chart/` and `/echarts-chart-build`. |
| Typography | Inter via `@fontsource/inter` | `--font-sans` in `style.css`, `antialiased`. No CDN fonts. |

## Folder layout (do not deviate)

```
Src/CarStore.Web/ClientApp/
  vite.config.ts             # base "/dist/", outDir ../wwwroot/dist, fixed main.js / main.css names
  tsconfig.json              # strict, noEmit, includes src/**/*.ts + src/**/*.vue
  package.json               # dev | build | preview scripts, plus visual:* (QA harness)
  playwright.config.ts       # visual harness only (Chromium, preview server 5175, baseline 5174)
  tsconfig.visual.json       # type-checks visual/ + playwright.config.ts (npm run visual:type-check)
  visual/                    # QA visual-check harness, test-only: never built, excluded from Tailwind
                             # scanning (`@source not "../visual"`). Owned by the QA agent; see visual/README.md
  src/
    main.ts                  # single entry: mounts the App shell once, on #app
    App.vue                  # SPA shell: Sidebar + <RouterView />
    router/index.ts          # vue-router routes ("/", "/cars", "/brands", "/customers")
    plugins/primevue-preset.ts # CarStorePreset (Aura + monochrome primary + Prometheus tokens), SURFACE_MODES
    style.css                # Tailwind + primeui imports, @source, paint palette, surface modes (--sm-*), html.app-dark theme, .lucide sizing
    types.ts                 # shared DTO interfaces mirroring Models/Api/*Dto.cs
    shims-vue.d.ts
    components/
      <Feature>Page.vue      # page composition: PageHeader + <Feature>Table + Create dialog
      <Feature>Table.vue     # DataTableCommon wrapper + row-action wiring
      Home.vue, PoweredByBadge.vue
      common/
        chart/               # <Type>Chart.vue (ECharts, generic, token-colored) - BarChart.vue
        dialog/              # <Verb><Entity>Dialog.vue + dialogStyles.ts
        form/                # FormField.vue (label + input slot), DetailField.vue (label + value)
        loader/              # ShowroomLoader.vue (loading placeholder)
        pageheader/          # PageHeader.vue (title, description, #actions slot)
        sidebar/             # Sidebar.vue (global nav + theme toggle, uses vue-router RouterLink/useRoute)
        table/               # DataTableCommon.vue (generic lazy paged DataTable)
    composables/             # usePagedFetch, useEntityCrud, useCreateEntity (data); useTheme (light/dark + surface mode);
                             # useTweenedNumber (animated counters)
    styles/                  # buttonStyles.ts - shared Tailwind class-string constants;
                             # icon-motion.css - Lucide hover/focus gestures (ported from Atlas), imported by main.ts
    utils/                   # format.ts - formatCurrency (BRL), formatDate (pt-BR);
                             # rowEffects.ts - per-row created/updated/leaving animation flags
```

Placement rules:

- Directly under `components/` **only** for a page (`<Feature>Page.vue`) or a page-specific `<Feature>Table.vue`.
- Anything reused by 2+ entities/pages goes to `components/common/<category>/` (`chart`, `dialog`, `form`, `loader`, `pageheader`, `sidebar`, `table`). Ask before inventing a new category.
- Stateful logic (fetch, dialog visibility, loading/error) belongs in `composables/`, not copy-pasted into components.
- Reusable Tailwind class strings go to `styles/`; `pt` objects shared by dialogs go to `common/dialog/dialogStyles.ts`.
- Pure helpers (formatting, parsing) go to `utils/`.

### Adding a new entity (naming template)

`Car`, `Brand`, `Customer` all follow the same file set. Scaffold a new entity (`<Entity>`) with exactly these
files - do not invent alternate names or fold steps together:

| File | Location | Responsibility |
|---|---|---|
| `<Entity>Page.vue` | `components/` | Composes `PageHeader` + `<Entity>Table` + the "New" dialog trigger. Owns the `/api/<entities>` URL constant. |
| `<Entity>Table.vue` | `components/` | Wraps `DataTableCommon`, defines `columns`, wires row actions to `useEntityCrud`. |
| `Create<Entity>Dialog.vue` | `common/dialog/` | Uses `useCreateEntity`; form fields via `FormField.vue`. |
| `Edit<Entity>Dialog.vue` | `common/dialog/` | Uses `useEntityCrud`'s edit state; form fields via `FormField.vue`. |
| `Details<Entity>Dialog.vue` | `common/dialog/` | Read-only, fields via `DetailField.vue`. |
| `ConfirmDeleteDialog.vue` | `common/dialog/` | **Shared** - reuse the existing one, never per-entity. |

Plus, outside `components/`:

- `types.ts` - add the entity's DTO interface(s), mirroring `Models/Api/<Entity>Dto.cs`.
- `router/index.ts` - add the route, pointed at `<Entity>Page.vue`.
- `common/sidebar/Sidebar.vue` - add the nav item.
- No new composable - `usePagedFetch`, `useEntityCrud`, `useCreateEntity` are already generic over `<TEntity>`; only new API URL constants change.

## Build loop

- Run `npm run build` after **every** ClientApp change (it is not part of `dotnet build`) and commit the rebuilt `wwwroot/dist` with the source: deployments serve it.
- `npx vue-tsc --noEmit` and `npm run build` must both pass before finishing.
- Local dev: `npm run dev` (5173) alongside `dotnet run --project Src/CarStore.Web`; in Development `#app` stays empty without it.

## Pages and routing

- `src/main.ts` mounts one app on `#app`; `App.vue` = `<Sidebar />` + `<RouterView />`.
- New page = route in `router/index.ts` + `<Feature>Page.vue` + nav item in `Sidebar.vue`. No Razor view needed.
- API URLs are static constants (`/api/cars`, `/api/brands`, `/api/customers`) inside the page component that owns the fetch.
- Cross-page state travels through the URL or the API (no Pinia).

## Data access

All data comes from the JSON API in `Src/CarStore.Web/Controllers/Api/*ApiController.cs` and is typed by
interfaces in `types.ts` mirroring `Models/Api/*Dto.cs`.

| Composable | Use for | Contract |
|---|---|---|
| `usePagedFetch<T>(apiUrl)` | Every list/table | `GET {apiUrl}?page=&pageSize=` -> `PagedResult<T>`; exposes `items`, `totalRecords`, `loading`, `error`, `load(page, pageSize)`. |
| `useEntityCrud<TEntity, TEditPayload>({apiUrl, entityLabel, reload})` | Row actions | Delete (`DELETE {apiUrl}/{id}`), Edit (`PUT {apiUrl}/{id}`), Details dialog state, per-action `loading`/`error`. |
| `useCreateEntity<TPayload>({apiUrl, entityLabel, onCreated})` | "New X" dialog | `POST {apiUrl}` + dialog visibility, `loading`, `error`. |

Rules:

- **Server-side paging only.** `DataTable` uses `lazy` + `paginator`; never fetch all rows and page client-side.
- API errors surface as `{ "message": "..." }` (a `DomainException` mapped to `400`); the composables already read `body.message` and fall back to the status code. Show it with a PrimeVue `Message severity="error"`, never `alert()`.
- Before writing a new fetch/loading/error block, extend one of the three composables instead.
- Extend `types.ts` when a DTO gains a field - keep it in sync with the C# DTO.

## Styling rules

1. **Design tokens, not hex.** Use the `tailwindcss-primeui` token utilities: `surface-0`, `surface-50`, `surface-100`, `surface-200`, `surface-300`, `surface-400`, `surface-500`, `surface-700`, `surface-800`, `text-color` (surface-800), `text-muted-color` (surface-500), `border-surface-200/300`, `bg-sunken` (inset box inside a card), `bg-primary`, `text-primary-contrast`. Never a raw hex or an arbitrary gray when a token matches.
2. **Style PrimeVue through `pt` (passthrough) sections** (`root`, `header`, `content`, `footer`, `list`, `itemLink`, `page`, ...) rather than a bare `class`, matching `DataTableCommon.vue` and `dialogStyles.ts`.
3. **`!important` is postfix in Tailwind v4**: `bg-surface-700!`, `text-color!`. Only add `!` when overriding a PrimeVue theme-colored state class (`.p-paginator-page-selected`, default Button primary) - PrimeVue injects its stylesheet after Tailwind, so equal-specificity utilities lose silently. Plain layout/spacing `pt` classes never need it.
4. **Arbitrary values are fine and expected** when the design does not land on Tailwind's scale: `rounded-[21px]`, `gap-1.75`, `px-[11.5px]`, `w-69.5`.
5. **Reuse the shared class strings**: `styles/buttonStyles.ts` (`primaryButtonClass`, `secondaryButtonClass`, `dangerButtonClass`) and `common/dialog/dialogStyles.ts` (`dialogShellPt(width, contentClass?)`, `detailsDialogPt(width)`). If a new combination appears in 2+ places, extract it there.
6. **Tailwind v4 config lives in `src/style.css`**: `@import "tailwindcss"; @import "tailwindcss-primeui";`. Content scanning only covers files under `ClientApp/`, so `@source "../../Views";` is what makes utility classes used in `.cshtml` files (e.g. `h-screen` on `<body>`) get generated. Keep it.
7. **No component-class shim.** The Razor-era `@layer components` block (`.btn*`, `.form-*`, `.alert-danger`) was removed on 2026-11-11. Never reintroduce Bootstrap-style class names. Use PrimeVue components, `pt` and the shared class strings.

### Light and dark themes (mandatory for every screen)

Every screen, dialog and chart must be readable in both themes. Internals (preset, `_Layout.cshtml` script, `useTheme`, `style.css` blocks): `reference/frontend-reference.md`.

Rules:

1. **Use tokens and the theme follows for free.** `surface-*`, `text-color`, `text-muted-color`, `border-surface-*` and `--color-paint-*` all flip under `html.app-dark`. A raw hex, `bg-white`, `text-black` or a fixed `gray-*`/`slate-*` utility does not: it is a dark-theme bug.
2. **Surfaces are inverted, not "dark versions".** In dark, `surface-0` is the darkest canvas and `surface-700/800` are light. So the near-black primary action (`bg-primary` = `primary.950` + `text-primary-contrast`) becomes a light fill with dark text. Use `primaryButtonClass`, never `text-white` on a `surface-*` fill. For the same reason, an inset box inside a card uses `bg-sunken`, not `bg-surface-50`, because in dark `surface-50` is the card itself.
3. **Keep `darkModeSelector: false`.** Enabling PrimeVue's dark mode would apply Aura's own dark palette on top of the inverted ramp. New surface modes go into `SURFACE_MODES` (preset), the `html[data-surface]` blocks in `style.css`, and the `_Layout.cshtml` list together. New dark-specific values go into the `html.app-dark` block in `style.css`, overriding the matching `--p-*` component token, never as per-component `.app-dark ...` selectors.
4. **Canvas consumers (ECharts) read CSS tokens at option-build time** and must rebuild on theme or surface change: watch `useTheme().theme` and `useTheme().surface` and call `setOption(buildOption())`, as `common/chart/BarChart.vue` does. Dark `--p-surface-50`/`-200` are `color-mix()` strings that a canvas cannot parse; read the plain steps (0, 100, 300, ...) instead.
5. **Elevation:** light-theme shadows vanish on dark, so cards and the sidebar sit one surface step above the canvas (`--p-card-background: var(--p-surface-50)`). Do not rely on a shadow alone to separate a panel.
6. **Contrast:** body text must stay at least 4.5:1 and large text/icons at least 3:1 in both themes. The existing ramp is tuned for this (muted `surface-500` 5.9:1; body text `surface-800` is above 14:1 on the canvas). Status colors use the tinted fill + light ink tokens already defined.
7. **Figma usually covers light only.** Derive dark from these existing tokens, never invent per-screen dark colors.

### Shared building blocks

| Piece | What it gives you |
|---|---|
| `common/table/DataTableCommon.vue` | Lazy paged `DataTable` + Figma-matched paginator/menu `pt`, `columns: DataTableColumn[]` (`field`, `header`, `primary`, `sortable`, `width`), `flush` mode (Figma table: 40px rows including the border, fixed layout), per-column `#col-<field>` slots, and a row-actions `Menu`. Row actions emit via `confirmDetails`/`confirmEdit`/`confirmDelete` -> `details`/`edit`/`delete` events. The `detailsUrl`/`editUrl`/`deleteUrl` navigate props are legacy: never use them. |
| `common/chart/BarChart.vue` | Generic ECharts bar (`labels`, `values`, optional `colorVar`); rebuilds on theme change. New chart types follow `/echarts-chart-build`. |
| `common/dialog/*` | `Create/Edit/Details<Car|Brand|Customer>Dialog`, and `ConfirmDeleteDialog`. Copy the closest one's `pt` wiring instead of hand-rolling spacing. |
| `common/form/FormField.vue` / `DetailField.vue` | Editable label + input slot / read-only label + value. |
| `common/pageheader/PageHeader.vue` | `title`, optional `description`, `#actions` slot (used for the "New X" button). |
| `common/sidebar/Sidebar.vue` | Global nav, mounted once inside `App.vue`, highlights the active route via `vue-router`'s `useRoute()`/`RouterLink`. |
| `styles/icon-motion.css` | Per-icon hover/focus gesture for Lucide icons, same file and keyframes (`sbi-*`) as Atlas. Opt in with the `icon-motion` class on the element whose hover should animate the icons inside it. Already on: sidebar rows, the shared button classes, `modalDialogPt` close button, `DataTableCommon` search/sort headers/kebab/row menu, Home KPI cards. A new icon gets its gesture in that file, keyed on `.lucide-<name>`; reduced motion turns all of it off. |
| `utils/format.ts` | `formatCurrency` (pt-BR / BRL) and `formatDate` (pt-BR). Use these, never inline `Intl` calls. |

## Working from Figma

1. `/figma-discovery` FIRST (it reuses `.figma-cache/` before calling the Figma MCP), then `/primevue-component-build`.
2. Query the `primevue` MCP for component APIs and `pt` section names instead of guessing.
3. Exported images go to `Src/CarStore.Web/wwwroot/images/<page>/` and are referenced by absolute URL (`/images/home/cars.jpg`), not imported through Vite.

## Definition of done

- [ ] Vault: `/vault-search` before and `/vault-write` after (in an orchestrated ticket, the orchestrator does both once).
- [ ] Existing composable/style/`pt` helper reused instead of duplicated.
- [ ] No raw hex where a token exists; no Bootstrap; no `bi-*` icons; no second JS/CSS framework.
- [ ] `npx vue-tsc --noEmit` clean.
- [ ] `npm run build` clean, and the rebuilt `wwwroot/dist` committed with the change.
- [ ] `dotnet build Src/CarStore.slnx` run if a `.cshtml` mount point or an API DTO changed.
- [ ] Page opened in the running app and checked against the Figma frame, in **both light and dark themes** (toggle in the sidebar).
- [ ] Visual validation, when requested, runs through the QA agent (`/frontend-visual-check`, harness in `ClientApp/visual/`), not the implementing agent.

## Never

- Never introduce a second UI framework (Bootstrap, Bulma) or a second JS framework (React, Angular).
- Never paginate client-side.
- Never hardcode colors that bypass the theme (`#fff`, `bg-white`, `text-black`, fixed `gray-*`/`slate-*`), and never switch `darkModeSelector` on.
- Never hardcode a `/api/*` base URL other than the documented constants; keep them colocated in the page component that owns the fetch.
- Never edit `wwwroot/dist/*` by hand; it is generated.
- Never change `vite.config.ts`, `package.json` deps, `.mcp.json` or `.vscode/mcp.json` from a component task - that is Frontend-Tooling-Specialist scope.
