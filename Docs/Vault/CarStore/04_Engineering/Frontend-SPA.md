---
type: guide
created: 2026-09-17
updated: 2026-11-12
tags:
  - note
  - type/guide
  - area/architecture
  - area/engineering
  - component/web
---

# Frontend SPA (Vue Router migration)

How `CarStore.Web` moved from an MVC "multi-page app with Vue islands" model to a single-page app (SPA)
rendered entirely by Vue Router, on 2026-09-17.

## Context

Before this change, MVC owned routing/navigation and every page (`/Cars`, `/Brands`, `/Customers`, `/`) had
its own Razor view with its own mount `<div>`, and `main.ts` mounted one independent Vue app instance per
mount point (no shared router, no shared client state). See git history for the old shape if needed — it is
no longer reflected in the instructions.

## What changed

- Added `vue-router` (`ClientApp/package.json`); `src/router/index.ts` maps `/`, `/cars`, `/brands`,
  `/customers` to `Home.vue`, `BooksPage.vue`, `AuthorsPage.vue`, `CustomersPage.vue`.
- Added `src/App.vue`: the SPA shell — `<Sidebar />` + `<RouterView />`.
- `src/main.ts` now mounts a **single** app on `#app`, wired with `.use(router)`.
- `Sidebar.vue` no longer takes `active`/`*Url` props; it uses `useRoute()`/`<router-link>` directly.
- `Home.vue`'s "Open Cars"/"Open Brands" buttons use `<router-link>` (via PrimeVue Button's `as` prop)
  instead of `data-*`-provided hrefs. `Home.vue` was later rewritten into a dashboard — see [[Home-Dashboard]].
- `BooksPage.vue`/`AuthorsPage.vue`/`CustomersPage.vue` hold their own static `/api/*` URL constants instead
  of receiving them as `data-*` props (there is only one mount point left, so there is nothing to pass).
- `CustomersPage.vue`/`CustomersTable.vue` were migrated from "list in Vue, CRUD via Razor forms" to full
  dialog-driven CRUD, matching Cars/Brands (`CreateCustomerDialog`, `EditCustomerDialog`,
  `DetailsCustomerDialog`, `ConfirmDeleteDialog`).
- `CustomersApiController` gained `Create`/`Update`/`Delete` (`CreateCustomerRequest` DTO added); it used to
  be GET-only.
- Removed: `BooksController`, `AuthorsController`, `CustomersController`, `Views/Cars/`, `Views/Brands/`,
  `Views/Customers/`, `Views/Home/Privacy.cshtml`, `_ValidationScriptsPartial.cshtml`, `_Pagination.cshtml`,
  the jQuery `<script>` tag in `_Layout.cshtml`.
- `Views/Home/Index.cshtml` is now the single SPA shell view: `<div id="app" class="flex h-full w-full"></div>` (the 40px page margin is `p-10` on `<main>` in `App.vue`, see [[Sidebar-Collapse-Expand]]).
- `Program.cs`: added `app.MapFallbackToController("Index", "Home")` after the default MVC route, so a
  hard refresh or deep link on any vue-router path (e.g. `/cars`) still resolves to the shell.

## Why

Requested explicitly as an architecture change; the previous "never turn this into an SPA" rule in
`frontend.instructions.md` was removed as part of the same change.

## Verification performed

- `npm run verify` clean (`vue-tsc --noEmit` + `check:conventions` + `vite build`; `scripts/check-conventions.mjs` enforces the icon, colour and Bootstrap rules).
- `dotnet build Src/CarStore.slnx` clean; `dotnet test` — 20/20 passing (domain tests unaffected).
- Manual smoke test: `/`, `/cars`, `/brands`, `/customers` all return 200 and serve the `div#app` shell
  (verifying the MVC fallback route); `/api/cars` and `/api/customers` unaffected; a full
  create → list → delete round trip against `POST/DELETE /api/customers` verified.

## Related

- [[Cars-Page]]
- [[Brands-Page]]
- [[Icon-Motion]]
- [[Visual-QA-Harness]]
- [[Theme-Surface-Modes]]
- [[UI-Language-pt-BR]]
- [[Architecture-Overview]]
- [[Controllers]]
- [[Application-Services]]
- [[Engineering-Overview]]
