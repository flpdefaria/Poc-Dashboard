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

None declares `figmaNode`: declaring one makes Figma evidence required, and `visual:verdict` then
downgrades PASS to BLOCKED until `references/<id>.png` and `.figma.json` exist.

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

### Git

| Path | Status |
|---|---|
| `qa-results/<run>/` bundles | Reviewable artifacts |
| `qa-results/index.html`, `qa-results/.current-run` | Ignored |
| `.visual-baseline/` | Ignored |
| `Src/CarStore.Web/ClientApp/test-results/` | Ignored |

## Related

- [[Frontend-SPA]]
- [[Home-Dashboard]]
- [[Theme-Surface-Modes]]
- [[Testing]]
- [[Operations-Overview]]
- [[MCP-Servers]]
