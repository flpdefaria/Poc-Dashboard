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

### Pitfalls

Measurement traps (PrimeVue vs Tailwind layers, CSS-only spec selectors, write mocks, half-pixel rounding, icon
glyph/stroke checks, console warnings) live in `Src/CarStore.Web/ClientApp/visual/LEARNINGS.md`, grouped by topic.
The harness README and this note no longer keep dated learning logs.

Reference runs: `qa-results/2026-11-11T19-20-27-011Z-cars-page/` (Cars-only, PASS) and
`qa-results/2026-11-11T21-59-27-336Z-cars-page/` (strict Cars QA, attempt-04 PASS). See [[Cars-Page]].

### Git

| Path | Status |
|---|---|
| `qa-results/<run>/` `findings.md`, `report.json`, `index.html`, `recheck-summary.json` | Versioned (the judgement) |
| `qa-results/<run>/` PNGs, `comparison/`, `data/`, `verdict-draft.json` | Ignored (local evidence) |
| `.figma-cache/` | Ignored |
| `qa-results/index.html`, `qa-results/.current-run` | Ignored |
| `.visual-baseline/` | Ignored |
| `Src/CarStore.Web/ClientApp/test-results/` | Ignored |

### Token-economy cycle (orchestrated tickets)

- `figma-discovery` caches each node once in `.figma-cache/<fileKey>/<node>/` (`discovery.md`, `design-context.md`, `variables.json`, `screenshot.png`, `meta.json`); frontend and QA agents read it before calling the Figma MCP.
- The orchestrator runs `vault-search` once and `vault-write` once after the last round; corrections and rechecks skip the vault, Figma MCP and instruction re-reads.
- First QA pass is exhaustive; corrections and rechecks (`visual:recheck`) run with `model: "sonnet"`. Rules live in `create-frontend-ticket` and `frontend-visual-check` (Recheck mode).
- Instructions are split: `frontend.instructions.md` holds the rules, `.github/instructions/reference/frontend-reference.md` the background (theme internals, bootstrap, setup, porting); the harness README holds the how-to and `visual/LEARNINGS.md` the pitfalls.
- Measured motivation: the Cars cycle used ~254M tokens over 13 subagents (7 QA runs), mostly re-reads and 167 opened screenshots.

## Related

- [[Frontend-SPA]]
- [[Home-Dashboard]]
- [[Theme-Surface-Modes]]
- [[Testing]]
- [[Operations-Overview]]
- [[MCP-Servers]]
