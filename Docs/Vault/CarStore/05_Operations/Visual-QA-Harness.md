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
| `npm run visual:recheck -- <bundle> [<ids>] [--no-baseline]` | Preferred recheck after a correction (`visual/run-recheck.mjs`). Re-runs the scenarios of the open `defeito` items, reuses the bundle's baseline commit and prints one JSON: `defeitos[]` (`resolvido`/`persiste`), `novas[]`, `abrir[]` (only images worth opening), `verdictDraft`. Writes `recheck-summary.json` and `verdict-draft.json` (previous judgement minus resolved ids). |
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
| `qa-results/<run>/` `findings.md`, `report.json`, `index.html`, `recheck-summary.json` | Versioned (the judgement) |
| `qa-results/<run>/` PNGs, `comparison/`, `data/`, `verdict-draft.json` | Ignored (local evidence) |
| `.figma-cache/` | Ignored |
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

### Caveats (strict Cars QA, fix-round recheck)

- An icon `svg` spec row checks the box, not the glyph. Compare the Figma vector bounds (`get_metadata` on the icon
  instance) with `path.getBBox()` scaled to px. Example: the Marca select chevron box is 14px, but the PrimeVue glyph is
  12x6.8px against the Figma vector's 8.05x4.55px.
- Spec rows do not check position inside a cell. Compare the `get_metadata` slot `y` with `child.top - row.top`.
  Example: the Cars body-row checkbox sits at 15.5px against Figma's 14.5px.
- `report.json` records console errors only. Grep the `visual:compare` output for `Vue warn`. Example: a SFC icon
  (`TrashIcon.vue`) inside a reactive Menu `model` warns "Vue received a Component that was made a reactive object".
- For ad-hoc measurement scripts while the harness holds 5175, run a second preview with
  `npm run dev -- --config visual/vite.config.ts --port 5185 --strictPort`.
- Run: `qa-results/2026-11-11T21-59-27-336Z-cars-page/` attempt-03 (FAIL). See [[Cars-Page]].
- Full list: "Learnings (2026-11-11, strict Cars QA, fix-round recheck)" in `visual/README.md`.

### Caveats (strict Cars QA, attempt-04 recheck)

- A clean `Vue warn` grep proves nothing if the run log carries no `[console.*]` lines. Confirm with a page `console`
  listener on the 5185 preview and fire a probe `console.warn` first.
- Calibrate icon weight against an icon already judged equal. Compare the summed ink in the 1x capture with the Figma PNG.
  Example: the card search icon gives 6574 against 6716, while the Marca chevron at 1.5px gives 2184 against 1463.
- Lucide `getBBox()` is the centreline. Add the stroke width before comparing it with a Figma vector's bounds.
- An 18px box at y=14.5 is anti-aliased across two rows in the Figma PNG and snapped to one row by Chromium, which leaves
  about 19 red px per box. Compare a body-row residual with the header's before calling it a position defect.
- Diff `actual/attempt-N-1` against `actual/attempt-N` (delta above 8 per channel) to isolate exactly what a fix changed.
- Run: `qa-results/2026-11-11T21-59-27-336Z-cars-page/` attempt-04 (PASS). See [[Cars-Page]].
- Full list: "Learnings (2026-11-11, strict Cars QA, attempt-04 recheck)" in `visual/README.md`.

### Token-economy cycle (orchestrated tickets)

- `figma-discovery` caches each node once in `.figma-cache/<fileKey>/<node>/` (`discovery.md`, `design-context.md`, `variables.json`, `screenshot.png`, `meta.json`); frontend and QA agents read it before calling the Figma MCP.
- The orchestrator runs `vault-search` once and `vault-write` once after the last round; corrections and rechecks skip the vault, Figma MCP and instruction re-reads.
- First QA pass is exhaustive; corrections and rechecks (`visual:recheck`) run with `model: "sonnet"`. Rules live in `create-frontend-ticket` and `frontend-visual-check` (Recheck mode).
- Measured motivation: the Cars cycle used ~254M tokens over 13 subagents (7 QA runs), mostly re-reads and 167 opened screenshots.

## Related

- [[Frontend-SPA]]
- [[Home-Dashboard]]
- [[Theme-Surface-Modes]]
- [[Testing]]
- [[Operations-Overview]]
- [[MCP-Servers]]
