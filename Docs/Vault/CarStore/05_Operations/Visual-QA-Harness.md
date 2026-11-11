---
type: guide
created: 2026-11-11
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/operations
  - area/engineering
  - component/web
---

# Visual QA Harness

A Playwright harness under `Src/CarStore.Web/ClientApp/visual/` renders real Vue components with mocked API
data. It compares three versions of each scenario and produces an offline QA bundle under the
repository-root `qa-results/`:

- **previous**: the base commit
- **current**: the working tree
- **Figma**: optional

## Context

The harness was ported from the Atlas project's QA harness, with the same `report.json` contract, report
tabs, verdict rules and baseline mechanics. It replaces the earlier QA flow, where the QA agent drove the
running app with the Playwright MCP and wrote `findings.md` by hand.

Owners:

- Claude `qa-agent` (`.claude/agents/qa-agent.md`)
- Copilot QA-Specialist (`.github/agents/qa-specialist.agent.md`)
- the `frontend-visual-check` skill (`.github/skills/frontend-visual-check/SKILL.md`)

The full reference is `Src/CarStore.Web/ClientApp/visual/README.md`.

## Details

### Commands

Run from `Src/CarStore.Web/ClientApp`:

| Command | Purpose |
|---|---|
| `npm run visual:compare -- <ids>` | Capture with the baseline. `VISUAL_BASELINE_REF=HEAD` compares uncommitted work. |
| `QA_RUN_DIR=<bundle> npm run visual:compare -- <ids>` | Correction round. Appends `attempt-NN`. |
| `npm run visual:verdict -- <verdict.json> <bundle>` | Records the QA judgement, then regenerates `findings.md` and `index.html`. |
| `npm run visual:type-check` | Type-checks the harness. |
| `npm run visual:test` | Runs the findings/verdict contract tests. |

Prerequisites: the dev dependencies `@playwright/test`, `pixelmatch`, `pngjs` and `@types/pngjs` in
`package.json`, plus `npx playwright install chromium`.

### How it renders

- **Preview.** `visual/preview.ts` mounts one component with `src/style.css`,
  `wwwroot/css/site.css`, `CarStorePreset`, the pt-BR PrimeVue locale, `ToastService` plus a global
  `<Toast>`, and a memory router.
- **Theme.** The preview applies `carstore-theme` / `carstore-surface`, `app-dark` and `data-surface`
  before the component loads, because `src/composables/useTheme.ts` reads them at import time.
- **Shell.** No `App.vue` shell is mounted. `pageWidth(viewport)` in `visual/scenarios/fixtures.ts`
  reproduces the production content width: viewport minus the 72px sidebar and the `p-10` main padding.
- **API data.** Every `/api/*` call is answered by a declared mock or aborted. The fixtures in
  `visual/scenarios/fixtures/*.json` are snapshots of the seeded API (`DataSeeder.cs`, `pageSize=100`).
  `pagedMock()` slices them into `PagedResult<T>`.
- **Determinism:**
  - Chromium, `UTC`, reduced motion, DPR 2.
  - The browser `Date` is pinned to `FIXED_NOW` in `visual/lib/config.ts`. Without it, the Home
    "Novos clientes" 12-month chart would shift every month.
  - `Home.vue` shows the showroom loader on every fresh load, so its scenarios wait for `.home-ready`.

### Ports

| Port | Server |
|---|---|
| 5175 | Visual preview server (`visual/vite.config.ts`) |
| 5174 | Baseline server (git worktree in `.visual-baseline/`) |
| 5173 | Normal `npm run dev`, untouched |

The harness needs neither `dotnet run` nor the normal dev server.

### Isolation from production

- `src/style.css` has `@source not "../visual";`. Without it, Tailwind v4's automatic scanning picked up
  class-like strings from the harness and changed `wwwroot/dist/main.css`.
- `visual/` is not a Rolldown input, so it never reaches `wwwroot/dist`.

### Scenarios shipped

- `home-dashboard-{light,dark}`
- `cars-page-{light,dark}`
- `customers-page-{light,dark}`
- `customers-page-empty-{light,dark}`: the "Outros estados" example
- `customer-create-car-select-*`, `customer-edit-car-*` (`scenarios/customer-dialogs.ts`)
- `scenarios/cars-figma.ts` (2026-11-11), with a light and a dark variant of each:
  - Figma-compared, captured at DPR 1: `cars-list`, `cars-row-menu`, `cars-row-selected`,
    `cars-bulk-delete-dialog`, `cars-details-dialog`, `cars-edit-dialog`, `cars-create-dialog`
  - Functional flows: `cars-pagination`, `cars-create-{success,error-400,validation}`,
    `cars-edit-{success,error-400}`, `cars-delete-{dialog,success,error-400}`,
    `cars-bulk-delete-{success,error}`, `cars-details-to-edit`
  - `brands-page`, for the PageHeader regression check

`home-dashboard-light` and the light Figma-compared Cars scenarios declare `figmaNode`. Declaring one makes
Figma evidence required: `visual:verdict` downgrades PASS to BLOCKED until `references/<id>.png` and
`.figma.json` exist.

### Learnings (2026-11-11, Home Figma parity)

- **Baseline geometry:** a baseline is reused only when the capture geometry is the same (viewport, DPR,
  mount width, theme and capture root, stored in `baseline/<id>.capture.json`). Otherwise it is archived
  to `baseline/history/` and recaptured. Attempt-02 of the Home run had compared a DPR 2 baseline with a
  DPR 1 capture.
- **Surface mode:** the preview defaults to the app's `DEFAULT_SURFACE_MODE`, not a hardcoded mode.
- **Figma export size:** `get_screenshot` exports at 1x. Figma-compared scenarios capture at DPR 1. Crop the
  parent frame at the child bounds to avoid shadow bleed.
- **Spec colors:** take them from `get_variable_defs`, which returns resolved values. The hexes in
  `get_design_context` code are fallbacks.
- **PASS needs whole-screen comparison:** data-driven sections make a scenario `partial`, which blocks PASS.
  Prefer a whole-screen comparison with a prototype-content fixture (`scenarios/fixtures-figma.ts`), then
  classify the residual pixel diff in the verdict.
- **New endpoint, every scenario:** when a page starts calling a new endpoint, update the mocks of **every**
  scenario of that page. On 2026-11-11, `CustomersPage` began loading `/api/cars/options`; the older
  `customers-page-*` scenarios had no mock for it, the call was aborted and the page reported a render error.
  That run also showed an app bug: the option loaders did not catch a failed `fetch`, now fixed in
  `CustomersPage` and `CarsPage`.
- **API tests port:** API contract tests must use a separate port (`--urls http://localhost:5046`). Port 5045
  may be the developer's own running instance.

### Learnings (2026-11-11, Cars screen QA)

- **PrimeVue styles beat Tailwind.** PrimeVue injects its component CSS outside any `@layer`. Tailwind v4
  utilities live in `@layer utilities`, so a `pt` class without `!` loses whenever the theme sets the same
  property. On the Cars run this left the dialogs at 20px insets, the row menu at 200px and the paginator
  buttons at 40px, and the Figma spec rows exposed all three. Suspect this first when a measured value equals
  the PrimeVue default.
- **Spec selectors are CSS.** `.figma.json` selectors go through `querySelector`, so Playwright-only
  syntax such as `:has-text()` reports `missing-element`.
- **Selected rows.** PrimeVue checkbox selection marks a row with `data-p-selected="true"`. The
  `p-datatable-row-selected` class needs `highlightOnSelect`.
- **Write mocks.** Mocks match the URL regardless of method. `/api/cars$` catches only the POST,
  `/api/cars/\d+$` catches PUT and DELETE, and `{ status: 400, body: { message } }` reproduces a
  `DomainException` response.
- Full list: "Learnings (2026-11-11, Cars screen run)" in `visual/README.md`.

### Git

| Path | Status |
|---|---|
| `qa-results/<run>/` bundles | Reviewable artifacts |
| `qa-results/index.html`, `qa-results/.current-run` | Ignored |
| `.visual-baseline/` | Ignored |
| `Src/CarStore.Web/ClientApp/test-results/` | Ignored |

### Measurement caveats (Cars round 2)

- Aura inputs and selects have a 0.2s `border-color` transition that `reducedMotion` does not stop. Wait about
  600ms after a focus or hover before reading computed colors.
- A `pt` key is dead when a slot replaces its element, as with the Menu `#itemicon` slot. Check the element's
  real `class`.
- `visual/scenarios/legacy-dialogs.ts` guards the legacy dialog shell (`dialogShellPt`, `dangerButtonClass`)
  on Brands create/delete and Customers delete against the base, in both themes.

### Measurement caveats (Cars second pass)

- A spec `strokeWidth` row reads the SVG `stroke-width` in viewBox units (24), not rendered px. Measure the
  rendered stroke as `stroke-width x size / 24`.
- An element screenshot taller than the viewport scrolls the page, and PrimeVue closes an open popup menu. Size the
  viewport so the capture fits.
- After opening a row menu, hover elsewhere (`h1`) before capturing, or the row hover ink replaces the open state.
- `visual/scenarios/cars-second-pass.ts` covers the Cars menu states and paginator, plus Brands/Customers menu
  guards against the base. Findings are in [[Cars-Page]].
- `dimension-mismatch` cannot go in `minimas`, and `artefato-harness` turns any verdict into BLOCKED.

### Measurement caveats (Cars second pass, recheck)

- The Cars row trigger sits on a half pixel, so a rounded popup position gives 4.5px below (the same as Figma) and
  3.5px above. Judge a "4px" gap as ±0.5px when whole-pixel positions are also required, and check for overlap.
- Fixing a 1px `dimension-mismatch` makes the pixel diff appear. Expect new text anti-aliasing rows to classify.
- `manual:` ids cannot go in `minimas`.
- For pages the delivery should not touch, diff `actual/attempt-NN` against the previous attempt (0 px expected).
- Full list: "Learnings (2026-11-11, Cars second pass, recheck)" in `visual/README.md`.

### Caveats (Cars-only QA bundle)

- Delete flows: `playRowExit` (`src/utils/rowEffects.ts`) hides the deleted ids (`row-fx-leaving`, 2s, keyed by id)
  and then reloads. A static list mock returns those ids again, so the capture shows a blank band. Give the list mock
  `responses: [before, after]` (`listAfterDelete` in `visual/scenarios/cars-figma.ts`), then wait for the reloaded
  first row, not just the toast.
- `visual/scenarios/cars-search.ts` covers the current-page search (match plus no result).
- Run: `qa-results/2026-11-11T19-20-27-011Z-cars-page/` (56 `cars-*` scenarios, PASS). See [[Cars-Page]].
- Full list: "Learnings (2026-11-11, Cars-only QA bundle)" in `visual/README.md`.

## Related

- [[Frontend-SPA]]
- [[Home-Dashboard]]
- [[Theme-Surface-Modes]]
- [[Testing]]
- [[Operations-Overview]]
- [[MCP-Servers]]
