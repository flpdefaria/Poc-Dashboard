---
name: primevue-component-build
description: "Builds or updates Vue 3 SFC components for an MVC + Vue app using PrimeVue components, PrimeVue design tokens, Tailwind CSS v4 utilities, and Lucide icons - and strips any leftover Bootstrap along the way. Use when: implementing a new component/dialog/table (often right after figma-discovery), restyling an existing component to match the design system, migrating a Razor page to Vue, or auditing a file for Bootstrap remnants."
argument-hint: "The component to create/update and, if available, the figma-discovery report for it"
---

# PrimeVue + Tailwind Component Build

Implements a Vue 3 component (or restyles an existing one) so it matches the codebase's established
PrimeVue-tokens + Tailwind + Lucide conventions, with zero Bootstrap. Assumes a `/figma-discovery`
report exists when the work is design-driven; if not, work from the closest existing analogous component
instead of inventing patterns.

Full conventions live in `.github/instructions/frontend.instructions.md` (ClientApp) and
`.github/instructions/web.instructions.md` (Razor mount points + API contract) - read them if anything below
is ambiguous.

## Procedure

1. **Place the file correctly.**
   - Page-level composition (`PageHeader` + table + create dialog) -> `components/<Feature>Page.vue`.
   - Page-specific table wrapper -> `components/<Feature>Table.vue`.
   - Reused across 2+ entities/pages -> `components/common/<category>/`, where `<category>` is `dialog`, `form`, `pageheader`, `sidebar`, or `table`. If none fit, ask before inventing a category.
2. **Reuse before creating.** Check these first and extend them instead of duplicating:
   - `composables/usePagedFetch.ts` (paged list fetch: `items`, `totalRecords`, `loading`, `error`, `load(page, pageSize)`).
   - `composables/useEntityCrud.ts` (delete/edit/details row-action state + fetch) and `composables/useCreateEntity.ts` (create-dialog state + POST).
   - `styles/buttonStyles.ts` (`primaryButtonClass`/`secondaryButtonClass`/`dangerButtonClass`).
   - `components/common/dialog/dialogStyles.ts` (`dialogShellPt(width, contentClass?)`/`detailsDialogPt(width)`).
   - `components/common/table/DataTableCommon.vue` for any list (columns, `#col-<field>` slots, row-action menu; actions emit via `confirmDetails`/`confirmEdit`/`confirmDelete` - the `detailsUrl`/`editUrl`/`deleteUrl` navigate props are legacy, do not use them for new work).
   - `components/common/form/FormField.vue` (editable label + input) / `DetailField.vue` (read-only label + value); `components/common/pageheader/PageHeader.vue` for the title + `#actions` slot.
   - `utils/format.ts` (`formatCurrency`, `formatDate`) for any pt-BR/BRL formatting.
3. **Respect the routing contract.** API URLs are static constants declared inside the page component that owns the fetch (`/api/cars`, `/api/brands`, ...) - never threaded through Razor `data-*` props, since there is only one mount point (`#app`) left. A new page needs a route in `src/router/index.ts` pointing at a `<Feature>Page.vue`, plus a nav item in `Sidebar.vue` - not a new `.cshtml` mount `<div>`.
4. **Apply PrimeVue design tokens for color** - never a raw hex: `surface-0/50/100/300/500/700/800`, `text-color`, `text-muted-color`, `border-surface-300`, `bg-primary`, `text-primary-contrast`. See the token table in `/figma-discovery` when translating a Figma spec.
5. **Style through `pt` (passthrough) sections** for components that expose them (`Dialog`, `DataTable`, `Paginator`, `Menu`, `Button` state overrides) rather than a bare `class` - this matches every existing dialog/table here.
6. **Apply Tailwind utilities for layout/spacing**, using arbitrary values (`w-[765px]`, `rounded-[21px]`, `gap-1.75`) when the design does not land on Tailwind's default scale - established convention, not a workaround.
7. **`!important` syntax:** always postfix (`bg-surface-700!`), never prefix. Only when overriding a PrimeVue component's OWN theme-colored state class (`.p-paginator-page-selected`, default Button primary); plain layout/spacing `pt` classes never need it.
8. **Icons and assets:** Lucide only (`@lucide/vue`): import the icon component and render it (`<Plus />`); its size follows the surrounding `text-*` class. Inside PrimeVue components pass it through a slot (`#icon` on `Button`/`Avatar`, `#itemicon` on `Menu`, the default slot of `InputIcon`), never the string `icon` prop. No PrimeIcons (`pi pi-*`). Figma-exported images go to `wwwroot/images/<page>/` and are referenced by absolute URL.
9. **Data and errors:** lists are `lazy` + `paginator` against `/api/*` (server-side paging only). API failures return `{ "message": "..." }`; surface it with a PrimeVue `Message severity="error"`, never `alert()`. Keep `types.ts` in sync with the C# DTOs.
10. **Bootstrap audit (always before finishing):** grep the touched files and `Src/CarStore.Web/**` (excluding `node_modules`, `wwwroot/dist`, `bin`, `obj`) for `bootstrap|bi-|cdn.jsdelivr.net/npm/bootstrap`. There are no more Razor CRUD forms in the app, so `btn`/`btn-primary`/`form-control`/`alert-danger` should not appear anywhere outside the now-dead `@layer components` shim in `src/style.css`; remove genuine Bootstrap `<link>`/`<script>` tags, a `wwwroot/lib/bootstrap/` folder, or `bi bi-*` icon usages if found.
11. **Verify.** From `Src/CarStore.Web/ClientApp`: `npx vue-tsc --noEmit`, then `npm run build`; fix all errors. If an API DTO changed, also run `dotnet build Src/CarStore.slnx`. Commit the regenerated `wwwroot/dist` with the change, then load the page (`dotnet run --project Src/CarStore.Web`, `http://localhost:5045`) and compare against the design.
12. **Record it.** The calling agent must run `/vault-write` afterwards with the component(s) changed, the Figma node implemented, and any new token mapping or shared helper extracted.

## Rules

- Never hardcode a color that already has a `surface-*`/`*-color` token equivalent.
- Never duplicate a Tailwind class string, `pt` config object, or fetch/loading/error state machine that already exists in `styles/`, `common/dialog/dialogStyles.ts`, or `composables/` - import and reuse, or extend it.
- Never introduce Bootstrap, jQuery-Bootstrap plugins, or `bi bi-*` icons - PrimeVue + Tailwind + Lucide only (no PrimeIcons `pi pi-*`).
- Never introduce a second JS framework, a second routing library, or a global store - `vue-router` already owns navigation; adding Pinia is a Frontend-Tooling-Specialist proposal, not this skill's call.
- Never paginate client-side.
- Never change `vite.config.ts`, `package.json`, `router/index.ts`'s setup, or the MCP config files (`.mcp.json`, `.vscode/mcp.json`) from this skill - that is Frontend-Tooling-Specialist's scope.
- Never add a new mount point or page-serving Razor view - a new page is a `router/index.ts` route + component + `Sidebar.vue` nav item.
- Never skip the `vue-tsc --noEmit` + `npm run build` verification step.
