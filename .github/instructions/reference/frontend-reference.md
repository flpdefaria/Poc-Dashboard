# Front-end reference (on demand)

Background for `../frontend.instructions.md`. **Not required reading for component work**: open a section
only when the task touches it (theme internals, app bootstrap, setup, or porting to another project).

## Theme internals

| Piece | Role |
|---|---|
| `plugins/primevue-preset.ts` | `CarStorePreset`: `--p-surface-N` = `var(--sm-N)`; `primary.N` aliases `surface.N` (Atlas "Noir": `primary.color` = `primary.950`, contrast = `surface.0`, highlight = solid `primary.950`); `extend` adds `--p-soft-*`, `--p-layout-*`, `--p-highlight-pressed-background`. |
| `Views/Shared/_Layout.cshtml` inline script | Before first paint: `app-dark` on `<html>` (saved `localStorage["carstore-theme"]`, else OS `prefers-color-scheme`) and `data-surface` (saved `localStorage["carstore-surface"]`, else `gray`). |
| `composables/useTheme.ts` | `useTheme()` -> `{ theme, surface, toggle, setTheme, setSurface }`. Applies the class/attribute, persists both choices, plays the circular View Transition reveal on theme changes (instant under reduced motion). |
| `common/sidebar/Sidebar.vue` | "Appearance" row (opens `common/dialog/ThemeSettingsDialog.vue`: light/dark + surface mode `gray`/`neutral`/`slate`/`stone`/`zinc`) and the "Dark theme" quick switch. |
| `src/style.css` -> `html[data-surface]` + `html.app-dark { ... }` | `data-surface` picks the Aura primitive palette behind `--sm-*`. Dark inverts `--p-surface-0...950` from the same `--sm-*` (canvas = mode 950, body text `surface-800` = mode 100, `surface-950` = white), plus card, tag/message/toast and `--color-paint-*` overrides. Aura's semantic tokens and the primary scale resolve through the surface scale, so PrimeVue components, Tailwind `surface-*`/`primary` utilities and the primary accent flip together. |

Dark theme name: "Showroom After Hours" (see `DESIGN.md`).

## App bootstrap

`src/main.ts` is the only entry point and mounts a single app on `#app` (declared in `Views/Home/Index.cshtml`):

```ts
const el = document.querySelector<HTMLElement>("#app");
if (el) {
  createApp(App)
    .use(router)
    .use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: false } } })
    .mount(el);
}
```

`App.vue` renders `<Sidebar />` next to `<RouterView />`. MVC's fallback route (`Program.cs`) serves the same
SPA shell for any unmatched path, so a new page needs no Razor view or mount `<div>`. There is no Pinia store;
add one only when two or more pages share client-side state.

## Setup and dev server

- Node.js 20+ (verified on 24), npm 10+, .NET 10 SDK. First clone: `npm install` in `Src/CarStore.Web/ClientApp`.
- `npm run dev` (port 5173) powers HMR: in `ASPNETCORE_ENVIRONMENT=Development`, `_Layout.cshtml` loads the SPA
  from `http://localhost:5173`. Run it alongside `dotnet run --project Src/CarStore.Web`; without it `#app` stays
  empty in Development (no fallback to the built bundle). Impeccable `live` mode (`.impeccable/live/config.json`)
  needs both processes.
- `wwwroot/dist/` is committed on purpose: `dotnet publish` / `deploy.sh` never run npm. `ClientApp/node_modules/`
  and `ClientApp/dist/` stay ignored.
- MCP servers (`primevue` stdio, `figma-mcp` http, `playwright` stdio) are declared identically in `.mcp.json`
  and `.vscode/mcp.json`; Frontend-Tooling-Specialist owns them.

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
