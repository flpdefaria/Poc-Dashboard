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

The report has five tabs:

| Tab | Content |
|---|---|
| **Resumo** | Totals, reasons by category, the per-combination table, the device × theme matrix and the QA verdict. |
| **Light** / **Dark** | Device sub-tabs, each with the full scenario cards. |
| **Outros estados** | Scenarios that declare a `state`. |
| **Detalhes técnicos** | Every scenario, the baseline, the attempts and the embedded `report.json`. |

Any anchor (`#<scenario-id>`, `#dark-desktop`) opens the tabs that contain it.

Run status measures Figma parity only:

| Status | Meaning |
|---|---|
| `passed` | Every scenario was compared and matches. |
| `differences` | At least one scenario differs. |
| `partial` | Something was captured, but evidence is missing. |
| `blocked` | Nothing was captured. |

A baseline difference is reported as "visual change vs base" and never fails the run.

## Baseline (previous version)

1. **Worktree.** The launcher (`run-compare.mjs` / `run-scenario.mjs`, using `lib/launch.mjs` and
   `lib/baseline.mjs`) runs `git worktree add --detach <repo>/.visual-baseline/<sha12> <sha>` before
   Playwright starts. It then overlays the current `visual/`, `playwright.config.ts` and
   `tsconfig.visual.json` on the worktree's `Src/CarStore.Web/ClientApp/`. The base's production code is
   never modified.
2. **Dependencies.**
   - Same `package-lock.json`: `node_modules` is symlinked (`depsStrategy: junction`).
   - Otherwise: `npm ci` runs in the worktree (`npm-ci`, about 6s).
3. **Capture.** Playwright starts a second preview server from the worktree on 5174. Each scenario is
   captured there with the same mocks, viewport, theme, clock and actions.
   - Use `baselineActions` when the new flow does not exist at the base, for example
     `[{ type: 'wait', ms: 3000 }]` when the base lacks a readiness hook.
   - A component missing at the base is reported as `absent-at-base`, which never fails the run.
4. **Cleanup.** The worktree is always removed afterwards. Keep it for debugging with
   `VISUAL_KEEP_BASELINE=1`.

`baselineStatus` values: `captured`, `reused` (from an earlier attempt), `absent-at-base`, `blocked` or
`disabled`.

A baseline is reused only for the same capture geometry (viewport, DPR, `mountWidth`, theme and
`captureSelector`), which is recorded in `baseline/<id>.capture.json`. When a correction round changes any
of these, the old baseline is moved to `baseline/history/<id>.before-attempt-NN.*` and the base is captured
again.

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

## Learnings (2026-11-11, Cars screen run)

`scenarios/cars-figma.ts` covers the Cars screen against seven Figma frames and the CRUD flows. Lessons
from that run:

- **Spec selectors are CSS.** `.figma.json` `checks[].selector` goes through `querySelector`, so
  Playwright-only syntax (`:has-text()`, `>> nth=`) reports `missing-element`. Use classes, `:nth-child`,
  `:has()` or attributes. `renderChecks` and `actions` use Playwright selectors, so these work there.
- **Checkbox selection.** With `selectionMode="multiple"`, PrimeVue adds `p-datatable-row-selected` only
  when `highlightOnSelect` is set. Target `tr[data-p-selected="true"]` instead.
- **Write mocks.** Mocks match the URL only, regardless of method. `/\/api\/cars$/` catches only the POST,
  because the list GET carries a query string. `/\/api\/cars\/\d+$/` catches PUT and DELETE. A
  `{ status: 400, body: { message } }` mock reproduces a `DomainException` response.
- **Overlays.** Capture popups and dialogs by their own root (`.p-menu-overlay`, `.p-dialog`). Crop the
  Figma frame at the overlay's `get_metadata` bounds. Toasts need a `body` capture.
- **Prototype data.** A Figma frame's sample rows may skip seed rows. The Cars list drops "Corolla", for
  example. Filter the fixture in the scenario so that the pixel diff measures layout, not data.
- **Classifying ids.** `verdict.diferencas` can classify any generated id. Only padding, margin, gap,
  radius and letter-spacing spec rows can go in `minimas`. A sub-pixel `width` row needs an explicit
  category instead.

## Learnings (2026-11-11, Cars screen round 2)

- **Focus and hover colors need a settle delay.** Aura inputs and selects have a 0.2s `border-color`
  transition, and `reducedMotion: 'reduce'` does not stop it. Wait about 600ms after `focus()`/`hover()`
  before reading `getComputedStyle`, or you will read the previous color.
- **A `pt` key can be dead when a slot replaces its element.** With the Menu `#itemicon` slot, PrimeVue passes
  only `cx('itemIcon')` as `class`, so `pt.itemIcon` classes never reach the icon. Check the element's real
  `class` attribute before trusting a `pt` fix.
- **Figma strokes are outside auto layout.** A 175x78 Figma menu with a 1px stroke and 4px padding is
  4px from the outer edge. In CSS the border adds 2px (80px), unless the padding drops to 3px.
- **`dimension-mismatch` never goes in `minimas`.** A 1px capture rounding needs an explicit category, and
  `artefato-harness` downgrades any verdict to BLOCKED.
- `scenarios/legacy-dialogs.ts` guards the legacy dialog shell (`dialogShellPt`, `dangerButtonClass`) on
  Brands create/delete and Customers delete against the base.

## Learnings (2026-11-11, Cars second pass: menu + paginator)

- **`strokeWidth` spec rows read viewBox units.** `getComputedStyle(svg).strokeWidth` returns the `stroke-width`
  attribute in the icon's 24-unit viewBox, not rendered px. For a Figma "1.5px" icon stroke, measure
  `stroke-width × renderedSize / 24` separately. Lucide's `absoluteStrokeWidth` divides by the `size` prop
  (default 24), not by the CSS size, so a `size-3.5!` icon with `stroke-width 1.5` renders 0.875px.
- **`@lucide/vue` 1.71: `Trash` is the old `Trash2`** (`aliases: ["trash-2"]`, 5 paths). Check the rendered
  path count, not the import name.
- **Popups close on scroll.** A `captureSelector` taller than the viewport makes the element screenshot scroll,
  and PrimeVue closes the menu. Size the viewport so the capture fits (`cars-row-menu-flip` uses 1440x760).
- **Move the pointer off the trigger** (`hover` on `h1`) after opening a row menu; otherwise the capture shows
  the row hover ink, not the open state.
- **Inline `transform-origin` is serialised.** PrimeVue writes `bottom`, Chromium reads back `center bottom`.
- `scenarios/cars-second-pass.ts` covers the open/closed/selected/flip menu states, paginator hover, rows per page
  and Brands/Customers menu guards. Menu-to-trigger geometry lives outside the capture root, so it is measured by
  the bundle's `evidence/measure.cjs`.

## Learnings (2026-11-11, Cars second pass, recheck)

- **Rounded popup positions on a half-pixel trigger cannot give an exact gap.** The Cars table rows put the ⋮ trigger at
  y = n.5, so `Math.round` on `trigger ± 4` yields 4.5px below (the same as Figma: trigger bottom 312.5, menu y317) and
  3.5px above. Judge "4px" as ±0.5px when whole-pixel positions are also required, and check for overlap instead.
- **Dimension fixes surface the pixel diff.** While a capture is 1px off, the harness emits no pixel diff. Once the size
  matches, expect new `#preview-root` pixel rows (text anti-aliasing plus the accepted colour deviations) that need
  classifying. Cluster the red pixels in `*.diff.png` before deciding between `minimas` and a category.
- **`manual:` ids cannot go in `minimas`.** Record a sub-pixel geometry judgement as a criterion with the measured
  values, or as a categorised `diferencas` entry.
- **Regression check across attempts.** For pages that the delivery should not touch, a pixel diff of `actual/attempt-NN`
  against the previous attempt (0 px expected) is a stronger guard than a diff against the base when the base differs
  for known reasons (here, the 18px PageHeader).

## Learnings (2026-11-11, Cars-only QA bundle)

- **Delete flows need a list mock that drops the deleted rows.** `playRowExit` (`src/utils/rowEffects.ts`) flags the
  deleted ids `row-fx-leaving` for 2s, keyed by id, then `reload()` runs. A static `pagedMock` sends the same ids back,
  so the reloaded rows stay invisible and the capture shows a blank band at the top of the table (also at the base).
  Use `responses: [before, after]` on the list mock (`listAfterDelete` in `scenarios/cars-figma.ts`). Then assert the
  reloaded first row and `tr.row-fx-leaving` count 0. Remember that page 1 refills to `pageSize` from the next seed rows.
- **The success toast appears before the reload.** Wait for the reloaded rows (`expect-text` on the new first row),
  not for the toast alone.
- **Search is current-page only.** `scenarios/cars-search.ts` covers a case-insensitive match and the no-result state.
  With no `#empty` slot, the no-result state is a blank `.p-datatable-empty-message` row.
- **Cars-only bundle:** `npm run visual:list | grep -oE "\bcars-[a-z0-9-]+-(light|dark)\b" | sort -u | paste -sd, -`
  gives the id list for `visual:compare`.

## Learnings (2026-11-11, strict Cars QA, no accepted deviations)

- **Spec `explanations` classify rows automatically.** An `intencional` entry in a `.figma.json` keeps accepting the row in
  every later run. When the policy changes, remove the entries (the expected values stay Figma's) and classify in the verdict.
- **Centred dialogs on a 900px viewport can sit at y = n.5.** A 487px dialog lands at y=206.5 and the element screenshot rounds to
  488 rows (`dimension-mismatch`, no pixel diff). Use an odd viewport height (`cars-bulk-delete-dialog` uses 1440x901) so the
  capture matches the frame and the pixel diff runs.
- **PrimeVue Dialog focuses the close button on show** when nothing in the footer, header or content has `[autofocus]`
  (`primevue/dialog` `focus()`), and Chromium shows `:focus-visible` on it. The ring appears in every dialog capture; spec rows
  cannot see `outline`, so measure it (`evidence/measure-dialogs.cjs`) and zoom the region.
- **Spec rows only cover what someone wrote.** Unchecked checkbox border, check icon size and dialog select chevrons had no
  rows, so earlier runs never measured them. Pull the component variables with `get_variable_defs` on the frame and add a row
  for each visible state, not only the one the delivery touched.
- `scenarios/selection-guards.ts` (`brands-row-selected`, `customers-row-selected`) guards the non-card DataTableCommon path:
  checked checkbox, selected row and active page against the base.
- `pngjs` is installed (no PIL): the bundle's `evidence/crop.cjs` crops the same box from the reference and the capture and
  scales them side by side for glyph-level checks.

## Learnings (2026-11-11, strict Cars QA, fix-round recheck)

- **An icon box row does not check the glyph.** A `width`/`height`/`color` spec row on `svg` passed at 14px #6b7280 while the
  PrimeVue `ChevronDownIcon` path fills 12x6.8px of the box and the Figma vector is 8.05x4.55px. Read the vector bounds with
  `get_metadata` on the icon instance and compare them with `path.getBBox()` scaled by `svgWidth / viewBox.width`
  (bundle `evidence/measure-chevron-glyph.cjs`).
- **Spec rows do not check position inside a cell.** An 18px checkbox can pass every size/colour row and still sit 1px low: an
  `inline-flex` checkbox with `vertical-align: bottom` in a 20px line box lands at 15.5px, Figma's slot is at y=14.5. Compare the
  `get_metadata` slot `y` with `child.top - row.top` (bundle `evidence/measure-checkbox-offset.cjs`), and count diff pixels in the
  column to confirm.
- **Vue warnings never reach `report.json`.** The report records console *errors* only. `console.warn` from the preview shows up in
  the run log as `[WebServer] ... [console.warn] [Vue warn]: ...`; grep the `visual:compare` output for `Vue warn` on every run.
  Example: a non-functional SFC icon (e.g. `TrashIcon.vue`) put into a reactive Menu `model` warns "Vue received a Component that
  was made a reactive object" on each open; Lucide icons are functional components and do not.
- **Keyboard focus on a checkbox needs a real Tab sequence.** `page.focus()` on the hidden `.p-checkbox-input` and one Tab can land
  outside the table. Focus the search input and Tab until `document.activeElement` is a `.p-checkbox-input`
  (bundle `evidence/measure-checkbox-focus.cjs`). Aura's focus-visible rule also replaces the box border, so read both outline and border.
- **A second preview for measurements.** While `visual:compare` holds 5175, run
  `npm run dev -- --config visual/vite.config.ts --port 5185 --strictPort` and pass `PORT=5185` to the bundle scripts.

## Learnings (2026-11-11, strict Cars QA, attempt-04 recheck)

- **A clean `Vue warn` grep is only proof if the log carries console output.** The attempt-04 `visual:compare` log had no
  `[console.*]` lines at all, so its 0 hits proved nothing. Confirm warnings with a page `console` listener on the measurement
  preview and fire a probe `console.warn` first (bundle `evidence/measure-trashicon-warning-attempt04.cjs`).
- **Calibrate icon weight against an accepted icon.** Sum the ink (`255 - G` above 20) in the 1x capture and in the Figma PNG for the
  icon under test and for one already judged equal (the card search icon: 6574 vs 6716). A ratio far from 1 (the Marca chevron
  at 1.5px: 2184 vs 1463) means the stroke weight differs even when the bbox matches. `evidence/probe-chevron-stroke-attempt04.cjs`
  sets `stroke-width` in the DOM to test candidate widths without touching code.
- **Lucide `getBBox` is the centreline.** Add the stroke width (round caps/joins) before comparing with a Figma vector's bounds.
- **Half-pixel Figma edges.** An 18px box at y=14.5 is anti-aliased across 2 rows in the Figma PNG and snapped to 1 row by Chromium,
  leaving about 19 red px per box. Compare a body-row residual with the header's before calling it a position defect.
- **Attempt-to-attempt capture diff** (`actual/attempt-N-1` vs `actual/attempt-N`, delta above 8 per channel) isolates exactly what a fix
  changed. Lower deltas (up to 8) appear on dark toast/backdrop captures between runs and are rasterization noise.
