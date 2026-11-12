# Visual-check harness

Renders **real** CarStore components in isolation, with deterministic API mocks, screenshots them with
Playwright/Chromium and compares three versions of each scenario. The output is an offline review bundle
under the repository-root `qa-results/`.

The three versions are:

- **Anterior / Previous**: the same scenario rendered from a base git commit.
- **Atual / Current**: the working tree.
- **Figma**: an optional reference PNG plus a `.figma.json` spec.

Ported from the Atlas harness (same `report.json` contract, report tabs, verdict rules and baseline
mechanics), adapted to `Src/CarStore.Web/ClientApp` (no Pinia, no i18n, no HTTPS dev cert).

Nothing here ships:

- `visual/` is not a Rolldown input, since `vite.config.ts` builds only `src/main.ts`.
- `src/style.css` excludes it from Tailwind scanning (`@source not "../visual"`).
- So `npm run build` and `wwwroot/dist` never see it.

## Commands

Run from `Src/CarStore.Web/ClientApp`. `visual:compare` is the normal QA command.

| Command | What it does |
|---|---|
| `npm run visual:compare` | Every scenario. The baseline is `auto` (`git merge-base HEAD origin/main`, then `main`). |
| `npm run visual:compare -- home-dashboard-light,home-dashboard-dark` | Only the named scenarios (comma-separated). |
| `VISUAL_BASELINE_REF=HEAD npm run visual:compare -- <ids>` | Compares uncommitted changes against the last commit. |
| `npm run visual:check:scenario -- <ids>` | Captures only, with no baseline unless `VISUAL_BASELINE_REF` is set. |
| `npm run visual:check` | Every scenario, without a baseline. |
| `npm run visual:list` | Lists the scenarios Playwright would run. |
| `npm run visual:verdict -- <verdict.json> <bundle>` | Records the QA judgement, then regenerates `findings.md` and `index.html`. |
| `npm run visual:type-check` | Type-checks the harness. It is not part of `npm run build`. |
| `npm run visual:test` | Runs the findings/verdict contract tests (`node --test`). |

First time on a machine: `npm install`, then `npx playwright install chromium`.

### Servers and ports

| Port | Server |
|---|---|
| 5175 | Visual preview server. Playwright starts it with `visual/vite.config.ts`, and reuses one already listening. |
| 5174 | Baseline preview server, run from the git worktree. Never reused. |
| 5173 | The normal `npm run dev` used by the ASP.NET app in Development. Not used by the harness, so both run side by side. |

To run the preview on another port, set `VISUAL_PORT=<port>`.

You do not need `dotnet run`. The preview never reaches the API: every `/api/*` request is answered by a
declared mock or aborted.

To open a preview by hand, start the visual server and browse it:

```bash
npm run dev -- --config visual/vite.config.ts --port 5175
# then open http://localhost:5175/visual/preview.html?scenario=<id>
```

### Correction rounds

Set `QA_RUN_DIR` to an existing bundle. The run then appends `attempt-02`, `attempt-03`, … to it. Earlier
attempts are never overwritten, and a subset rerun keeps the other scenarios' latest results.

```bash
QA_RUN_DIR=/abs/path/qa-results/<run> npm run visual:compare -- <ids>
```

A new attempt invalidates the recorded verdict and moves it to `verdictHistory`, so submit a fresh review.

**Recheck after a correction (preferred, token-cheap):**

```bash
npm run visual:recheck -- /abs/path/qa-results/<run>            # scenarios of the open `defeito` items
npm run visual:recheck -- /abs/path/qa-results/<run> <ids>      # named scenarios
```

It appends an attempt (reusing the bundle's baseline commit; `--no-baseline` skips it) and prints one JSON:
`defeitos[]` (`resolvido` / `persiste`), `novas[]`, `abrir[]` (the only images worth opening) and
`verdictDraft` — the previous judgement minus resolved ids. Classify only `persiste`/`novas` in the draft,
then `npm run visual:verdict -- <verdictDraft> <run>`. With nothing persisting and no `novas`, the draft
records PASS without opening any image.

## Preview

`visual/preview.ts` mounts the scenario component with the production wiring:

- `src/style.css` and `wwwroot/css/site.css` (root font size 14px, or 16px at 768px and up).
- `CarStorePreset` with `darkModeSelector: false`, the pt-BR PrimeVue locale, and `ToastService` with a
  global `<Toast position="bottom-right" />`, as in `App.vue`.
- A memory router: a catch-all route, plus a stub per entry in `routeNames`.

The theme follows `_Layout.cshtml`. The preview writes `localStorage["carstore-theme"]` and
`["carstore-surface"]`, puts `app-dark` / `data-surface` on `<html>` and `bg-surface-0` on `<body>`, all
before the component module loads. This matters because `useTheme.ts` reads them at import time.

`App.vue` (sidebar plus `<main class="p-10">`) is not mounted. A page component at a desktop viewport is
`viewport − 72 − 80` px wide in production, so set `mountWidth: pageWidth(viewport.width)` (from
`scenarios/fixtures.ts`) to render pages at their real width.

## Adding a scenario

1. Add the scenario to a file in `visual/scenarios/` and register the file in `scenarios/index.ts`. The
   type is `VisualScenario` (see `types.ts`); `scenarios/entity-pages.ts` is a compact example.
2. Import the real component with a relative path: `component: () => import('../../src/components/X.vue')`.
3. Declare **every** API call in `mocks`. Use the helpers in `scenarios/fixtures.ts`:
   - `pagedMock(apiUrl, items, pageSize, page?)` reproduces `PagedResult<T>`.
   - `jsonMock(url, body)` answers any other call.
   - `homeMocks()` covers Home's four calls.

   An undeclared `/api` call is aborted and listed as a blocked request in the report. That means a mock
   is missing, not that the harness failed.
4. Fixtures (`scenarios/fixtures/*.json`) are snapshots of the seeded API taken at `pageSize=100`. Edit or
   filter them in the scenario to get other states, for example `pagedMock('/api/customers', [], 10)`
   for the empty state.
5. Add a dark sibling for every light scenario. `visual:verdict` blocks PASS when one is missing.
6. Wait for the real state before the screenshot:
   - Use `actions` (`expect-count`, `expect-text`, `click`, `fill`, `hover`, `wait`, …).
   - `Home.vue` plays the showroom loader on every fresh page load. Wait for `.home-ready`.
7. Set `captureSelector` to the component's own root. Screenshots are element screenshots.
8. Use `state: '<label>'` for non-default states (empty, loading, error, dialog). These scenarios are
   listed in the "Outros estados" tab and never fill the device × theme matrix.

### Determinism

| Setting | Value |
|---|---|
| Browser | Chromium |
| Timezone | `UTC` |
| Motion | `reducedMotion: 'reduce'`, and screenshots use `animations: 'disabled'`. The tweened KPI numbers land instantly. |
| Device scale factor | 2 (default) |
| Clock | Browser `Date` is pinned to `FIXED_NOW` (`lib/config.ts`, override per scenario with `now`). Timers and `performance.now()` keep running. |
| Service workers | Blocked |
| External requests | Every request outside the preview origin is aborted |

Pinning the clock matters: Home's "Novos clientes" chart shows the 12 months before *today*. Without a
fixed clock, the capture would change every month and differ between baseline and current.

### Requirements without Figma: `renderChecks`

`renderChecks` declares requirement checks on the current render only. Each check has a `label`, a real
`selector` (Playwright selectors such as `:has-text()` and `:text-is()` work), and any of:

- `count`
- `text`: a whitespace-normalized substring
- `value`: an input value

They are written to `comparison/attempt-NN/<id>.requirements.json`, and failures become findings. They are
not Figma evidence and never run on the baseline.

`8 passed` from Playwright means the captures completed, not that the review passed.

`responsiveCheck: { minTouchTarget: 44 }` measures the following on the same page state and writes
`<id>.responsive.json`:

- horizontal overflow
- undersized touch targets
- clipped text
- low contrast (text under 4.5:1)

CarStore is desktop-only today; see `carstore-mobile-responsive` before adding phone scenarios.

## Figma reference and spec

There are two files per scenario in `visual/references/`, both produced by qa-agent from the Figma MCP
(see `references/README.md`):

| File | Content |
|---|---|
| `<id>.png` | `get_screenshot` at the scenario's `deviceScaleFactor`, cropped to the element `captureSelector` targets. Dimensions must match the capture: images are **never rescaled**, and a mismatch is a finding. |
| `<id>.figma.json` | `FigmaSpec` (`types.ts`, validated by `lib/spec-check.ts`). It holds `source`, `frame`, and `checks[]` (each with `nodeId`, `selector` inside the capture root, and `props` / `text` / `token`). Optional fields: `texts`, `tokens`, `tree`, `codeConnect`, `primevue`, `notes`, `explanations`. |

Checks are measured with `getBoundingClientRect` and `getComputedStyle` on the screenshot's page state.
Tolerance is ±1px for lengths and ±2 per color channel; a check can override both. The spec is also run
against the baseline, which shows whether a change moved toward the design or away from it.

The expected values come from Figma, **never** from the current render. Never put a harness screenshot in
`references/`.

| Figma PNG | Figma spec | Scenario status |
|---|---|---|
| passed | passed | `passed` |
| either one differs | | `differences` |
| only one exists, and it passed | | `partial` |
| neither | | `not-applicable` |

Two optional fields on the scenario control how a missing reference is treated:

- `referenceNote` explains in the report why there is no reference.
- `figmaNode` declares that Figma evidence is **required**: `visual:verdict` blocks PASS until both files
  exist. Do not set it on scenarios that have no design.

### Sections and dynamic height

When the Figma frame height follows the content (table rows, ranking items), declare `sections` (see
`VisualSection` in `types.ts`). Each section is compared with the `get_screenshot` of its own child node,
saved as `references/<id>.<section>.png`.

| `heightMode` | Rule |
|---|---|
| `fixed` | Width and height are both required. |
| `dynamic` | Only the width is required. When heights differ, only the common top strip is compared (`partial-region`). |

`dataDriven: true` with a `reason` turns a fixture-driven pixel diff into information. The harness audits
it by re-diffing with text masked.

### `explanations` in the `.figma.json`

`explanations` is the QA registry of **why** a spec row or a section does not pass. Each entry has a
`category` (`defeito`, `backend`, `decisao-design`, `artefato-harness`, `intencional` or
`conteudo-dinamico`) and a `text`.

Rows without an entry show as `nao-classificado`, and an unclassified row blocks PASS.

## Run bundle layout

```
qa-results/<utc-timestamp>-<component-slug | multi-component>/
  index.html                  offline report (inline CSS/JS, relative images, no network)
  report.json                 schema carstore-visual-check/6
  findings.md                 QA decision (generated; edit through visual:verdict, never by hand)
  reference/<id>.png  reference/<id>.figma.json
  actual/attempt-NN/<id>.png
  comparison/attempt-NN/<id>.diff.png  .side-by-side.png        current vs Figma
  comparison/attempt-NN/<id>.baseline.diff.png  .baseline.side-by-side.png
  comparison/attempt-NN/<id>.triptych.png                       previous | current | figma
  comparison/attempt-NN/<id>.requirements.json  .responsive.json
  baseline/<id>.png  baseline/<id>.absent.json  baseline/<id>.spec-check.json
  data/scenarios.json  data/mocks.json  data/capture-config.json  data/provenance.json
```

`qa-results/index.html` lists every run, newest first. It is git-ignored, as is `qa-results/.current-run`.

The report tabs are Resumo, Light, Dark, Outros estados (scenarios with a `state`) and Detalhes técnicos;
any anchor (`#<scenario-id>`) opens the tab that contains it.

Run status measures Figma parity only:

| Status | Meaning |
|---|---|
| `passed` | Every scenario was compared and matches. |
| `differences` | At least one scenario differs. |
| `partial` | Something was captured, but evidence is missing. |
| `blocked` | Nothing was captured. |

A baseline difference is reported as "visual change vs base" and never fails the run.

## Baseline (previous version)

The launcher (`lib/launch.mjs`, `lib/baseline.mjs`) checks the base commit out as a detached worktree in
`<repo>/.visual-baseline/<sha12>`, overlays the current `visual/` harness on it (base production code is never
modified), symlinks `node_modules` when the lockfile matches (else `npm ci`), and captures every scenario
there on port 5174 with the same mocks, viewport, theme, clock and actions. The worktree is removed afterwards
(`VISUAL_KEEP_BASELINE=1` keeps it).

- `baselineActions` replaces `actions` at the base when the new flow does not exist there.
- `baselineStatus`: `captured`, `reused` (earlier attempt, same geometry recorded in
  `baseline/<id>.capture.json`), `absent-at-base` (never fails the run), `blocked` or `disabled`. A geometry
  change moves the old capture to `baseline/history/` and captures again.

## Figma exports at 1x

The Figma MCP `get_screenshot` exports at the node's natural size (1x) and does not upscale. A scenario
compared with Figma therefore captures at `deviceScaleFactor: 1`; `home-dashboard-light` is the example.

Exports of a card node can carry 3–6px of drop shadow beyond the node's bounds. Export the parent frame
instead and crop each section at its node's `get_metadata` bounds. Record the crop in the spec `notes`.

## QA judgement and findings.md

Every capture writes `findings.md` with status **BLOCKED** until QA records a review.

To record one, write a verdict JSON and run `npm run visual:verdict -- <verdict.json> <bundle>`:

```json
{
  "result": "PASS",
  "criteria": [{ "text": "Requested state renders in both themes", "status": "pass",
    "evidence": ["actual/attempt-01/home-dashboard-light.png", "actual/attempt-01/home-dashboard-dark.png"] }],
  "diferencas": [],
  "minimas": [],
  "bloqueios": [],
  "notes": ["Images reviewed against the requested layout."]
}
```

`diferencas` classifies measured differences by their generated `id`:

```json
{ "id": "<id>", "categoria": "defeito", "motivo": "…", "imagem": "actual/attempt-01/x.png" }
```

A manual finding uses an id starting with `manual:`, plus `cenario`, `seletor`, `esperado`, `atual`,
`categoria`, `imagem` and `motivo`.

`minimas` holds small, similar differences accepted by explicit judgement. Only pixel differences and
isolated spacing, radius or tracking spec rows qualify. These never qualify:

- missing elements
- wrong text
- requirement failures
- overflow
- contrast
- broken states

The CLI enforces the evidence. It **downgrades** a requested PASS when any of these is true:

- An evidence file is missing.
- A light scenario has no dark sibling.
- Figma evidence for a scenario that declares `figmaNode` is partial.
- A `nao-classificado` item remains.
- A `decisao-design`, `backend` or `artefato-harness` item exists.

It returns FAIL when a defect or failed criterion is evidenced and nothing blocks. Read `qaFindings.status`
in `report.json`, not the exit code.

## Pitfalls

Measurement traps (selectors, PrimeVue/Lucide quirks, half-pixel rounding, mocks, console) are in
`LEARNINGS.md`, grouped by topic. Open the matching section only when a result looks wrong, and add new traps
there, not here.
