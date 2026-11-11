---
applyTo: "Src/CarStore.Web/ClientApp/**,Src/CarStore.Web/wwwroot/dist/**"
---

# Front-end instructions (Vue 3 + PrimeVue + Tailwind v4)

Reference guide for humans and coding agents working inside `Src/CarStore.Web/ClientApp/`.
For how the built bundle is served by ASP.NET Core MVC (Razor mount points, API endpoints, run/publish),
see `web.instructions.md`. For the vault rules, see `vault.instructions.md`.

This file documents the **reference implementation**. The same architecture is reused when migrating other
classic MVC + Razor + Bootstrap projects - see "Porting to a new project" at the end.

Follow the vault workflow in `.github/copilot-instructions.md` (`vault-search` before, `vault-write` after).

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Vue 3.5 SFC, `<script setup lang="ts">` | Single-page app: `vue-router` (history mode) owns client-side navigation. No Pinia yet. |
| Build | Vite 8 (Rolldown) + `@vitejs/plugin-vue` 6 | Output goes to `../wwwroot/dist`. |
| UI kit | PrimeVue 4 + `@primeuix/themes` 1 (`CarStorePreset` on Aura, `src/plugins/primevue-preset.ts`) | Monochrome primary and surface modes modeled on the Atlas app (Prometheus design system). Registered in `src/main.ts` with `darkModeSelector: false` **on purpose**: the app has light AND dark themes, but dark is implemented by inverting the surface scale under `html.app-dark` (see "Light and dark themes"), not by PrimeVue's dark mode. |
| Icons | `@lucide/vue` (Lucide) | Import each icon as a component (`import { Plus } from "@lucide/vue"`, then `<Plus />`). Sized to `1em` by a `.lucide` rule in `src/style.css`, so the surrounding `text-*` class sets the size; a `size-*` utility on the icon overrides it. In PrimeVue components use the `#icon` slot (`Button`, `Avatar`), `#itemicon` (`Menu`) or `InputIcon`'s default slot - never the string `icon` prop. Never PrimeIcons (`pi pi-*`) or Bootstrap Icons (`bi-*`), never a raw SVG when a Lucide icon exists. |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` + `tailwindcss-primeui` | CSS-first config: **there is no `tailwind.config.js`**. |
| Types | TypeScript 6, `strict: true`, `vue-tsc` 3 (TypeScript 7 is not supported by `vue-tsc` yet - do not upgrade) | `tsconfig.json` is `noEmit` - Vite does the transpiling. |
| Bootstrap / jQuery | **Removed** | No Razor forms remain; every CRUD flow is a Vue dialog. Do not reintroduce either. |
| Charts | Apache ECharts 6, tree-shaken (`echarts/core`) | Only via `components/common/chart/` and the `/echarts-chart-build` skill. |
| Typography | Inter via `@fontsource/inter` (self-hosted, Latin + Latin Extended, 400-700) | `--font-sans` in `src/style.css`; `html` uses grayscale smoothing (`antialiased`) like the Figma frames. No CDN fonts. |

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

## Setup

Prerequisites: Node.js 20+ (repo verified on Node 24) and npm 10+; .NET 10 SDK for the host app.

```bash
cd Src/CarStore.Web/ClientApp
npm install          # first clone only
npm run build        # emits ../wwwroot/dist/main.js + main.css
```

MCP servers used by the front-end agents (`primevue` stdio, `figma-mcp` http, `playwright` stdio) are declared,
with identical content, in `.vscode/mcp.json` (VS Code/Copilot) and `.mcp.json` (Claude Code). Both are committed;
creating/repairing them is Frontend-Tooling-Specialist's job, and they must change together.

## Build / run loop

- `npm run build` is **not** wired into `dotnet build` or the `.csproj`. Re-run it after **every** ClientApp change and commit the rebuilt `wwwroot/dist` - it is what every non-Development environment (and `deploy.sh`) serves.
- `npm run dev` (Vite dev server, fixed port `5173`) now powers real front-end HMR: `Views/Shared/_Layout.cshtml` loads the SPA from `http://localhost:5173` instead of `~/dist/main.js` whenever `ASPNETCORE_ENVIRONMENT=Development`. Run it alongside `dotnet run --project Src/CarStore.Web` (or the `watch` task) - both processes must be up for local component work and for Impeccable `live` mode (`.impeccable/live/config.json` targets `_Layout.cshtml`). If `npm run dev` isn't running, `#app` stays empty in Development - it does **not** fall back to the built bundle.
- `wwwroot/dist/` **is committed to git on purpose**: `dotnet publish` / `deploy.sh` never run npm, so the deployed app would have no front-end without it. Commit the rebuilt bundle together with the source change even though local dev now goes through Vite HMR. (`ClientApp/node_modules/` and `ClientApp/dist/` stay ignored.)
- Type-check with `npx vue-tsc --noEmit` before finishing. Both this and `npm run build` must pass.

## How a component reaches the page

`src/main.ts` is the only entry point. It mounts a **single** app once, on `#app` (the only mount point,
declared in `Views/Home/Index.cshtml`), wired with `vue-router`:

```ts
const el = document.querySelector<HTMLElement>("#app");
if (el) {
  createApp(App)
    .use(router)
    .use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: false } } })
    .mount(el);
}
```

`App.vue` renders `<Sidebar />` next to `<RouterView />`; `router/index.ts` maps each path to a `<Feature>Page.vue`
component. Consequences to respect:

- API URLs are static (`/api/cars`, `/api/brands`, `/api/customers`) and are declared as constants inside
  each page component - they are no longer threaded through Razor `data-*` attributes, since there is only one
  mount point left.
- Adding a new page = add the route in `router/index.ts`, add the component, add a nav item in `Sidebar.vue`.
  No new Razor view or mount `<div>` is needed - MVC's fallback route (`Program.cs`) serves the same SPA shell
  for any unmatched path.
- Cross-page state still travels through the URL or the API; there is no Pinia store yet. Add one if two or
  more pages need to share client-side state.

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

The app ships both themes ("Showroom After Hours" dark theme, see `DESIGN.md`). Every screen, dialog and chart must be readable and consistent in both.

| Piece | Role |
|---|---|
| `plugins/primevue-preset.ts` | `CarStorePreset`: `--p-surface-N` = `var(--sm-N)`; `primary.N` aliases `surface.N` (Atlas "Noir": `primary.color` = `primary.950`, contrast = `surface.0`, highlight = solid `primary.950`); `extend` adds `--p-soft-*`, `--p-layout-*`, `--p-highlight-pressed-background`. |
| `Views/Shared/_Layout.cshtml` inline script | Before first paint: `app-dark` on `<html>` (saved `localStorage["carstore-theme"]`, else OS `prefers-color-scheme`) and `data-surface` (saved `localStorage["carstore-surface"]`, else `gray`). |
| `composables/useTheme.ts` | `useTheme()` -> `{ theme, surface, toggle, setTheme, setSurface }`. Applies the class/attribute, persists both choices, plays the circular View Transition reveal on theme changes (instant under reduced motion). |
| `common/sidebar/Sidebar.vue` | "Appearance" row (opens `common/dialog/ThemeSettingsDialog.vue`: light/dark + surface mode `gray`/`neutral`/`slate`/`stone`/`zinc`) and the "Dark theme" quick switch. |
| `src/style.css` -> `html[data-surface]` + `html.app-dark { ... }` | `data-surface` picks the Aura primitive palette behind `--sm-*`. Dark inverts `--p-surface-0...950` from the same `--sm-*` (canvas = mode 950, body text `surface-800` = mode 100, `surface-950` = white), plus card, tag/message/toast and `--color-paint-*` overrides. Aura's semantic tokens and the primary scale resolve through the surface scale, so PrimeVue components, Tailwind `surface-*`/`primary` utilities and the primary accent flip together. |

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

1. Run `/figma-discovery` FIRST for any task that references a Figma URL/node or must match a design. It parses the URL, calls the Figma MCP tools, and maps raw values onto the token conventions above.
2. Then run `/primevue-component-build` (or follow the equivalent manual steps) to implement.
3. Query the `primevue` MCP server for component APIs/examples instead of guessing prop or `pt` section names.
4. Exported image/icon assets go to `Src/CarStore.Web/wwwroot/images/<page>/...` and are referenced by absolute URL (`/images/home/cars.jpg`) - not imported through Vite, so no hashing surprises.
5. Delete temporary screenshots/reference assets once the implementation is verified.

## Definition of done

- [ ] `/vault-search` ran before the work, `/vault-write` after it.
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

## Porting to a new project

When migrating another classic MVC + Razor + Bootstrap app, reproduce this exact shape:

1. `<WebProject>/ClientApp/` scaffolded with Vite + Vue 3 + TS; `build.outDir` -> `../wwwroot/dist`, `base: "/dist/"`, fixed `main.js` / `main.css` output names.
2. `npm i vue primevue @primeuix/themes @lucide/vue` + `npm i -D vite @vitejs/plugin-vue tailwindcss @tailwindcss/vite tailwindcss-primeui typescript vue-tsc`.
3. `src/style.css` with the `@import`s and `@source "../../Views";`. Add a temporary `@layer components` shim only while Razor forms still need Bootstrap class names, and delete it with the last form.
4. `src/main.ts` mounting a single `App` (Sidebar + `RouterView`) on `#app`, with `vue-router` and the PrimeVue/Aura registration; `src/router/index.ts` for the routes.
5. Remove `wwwroot/lib/bootstrap/` and every Bootstrap `<link>`/`<script>`/`bi-*` icon; keep jQuery + jquery-validation only while Razor forms still use unobtrusive validation.
6. Add `Controllers/Api/*ApiController.cs` + `Models/Api/*Dto.cs` returning `PagedResultDto<T>`, reusing the existing services (never re-implement paging or business rules).
7. Migrate page by page: add a route + `<Feature>Page.vue` over the paged API, then the CRUD dialogs, then delete the old Razor controller/views (see `web.instructions.md` -> "Porting to a new project").
8. Copy `composables/`, `common/table`, `common/dialog`, `common/form`, `common/pageheader`, `styles/`, `utils/` as the starting kit, then adapt to that project's design system.
9. Create `.mcp.json` and `.vscode/mcp.json` with the `primevue`, `figma-mcp` and `playwright` servers.
10. Seed the new project's vault with the equivalent front-end notes via `/vault-write`.
