# Visual-check harness

Renders **real** project components in isolation, with deterministic API mocks, screenshots them with
Playwright/Chromium and compares three versions of each scenario. The output is an offline review bundle
under the repository-root `qa-results/`.

The three versions are:

- **Anterior / Previous**: the same scenario rendered from a base git commit.
- **Atual / Current**: the working tree.
- **Figma**: an optional reference PNG plus a `.figma.json` spec.

Generic engine of the frontend flow kit. The engine is
project-agnostic; a project adapts exactly these files:

| File | What to set |
|---|---|
| `visual/project.json` | `projectName`, `clientAppDir` (repo-relative path of the folder holding `package.json`; `"."` at the repo root), `devServerHttps`, `apiBasePath`, `fixedNow`, `locale`, `timezone`, ports, `artifactDir`. |
| `visual/app-setup.ts` | Browser side: global CSS, PrimeVue preset/options/locale, services, theme switching (`applyTheme`) and the global elements around the component (`renderRoot`). Mirror `src/main.ts` + the host page. |
| `visual/scenarios/fixtures.ts` | The paged response shape and query string (`paged`, `pagedMock`) and the shell width (`pageWidth`). |
| `visual/scenarios/*.ts` | The scenarios (replace `example.ts`) and API snapshots in `scenarios/fixtures/`. |

The engine also assumes `npm run dev` runs Vite (Playwright starts `npm run dev -- --config visual/vite.config.ts`)
and that the production `vite.config.ts` is importable from `visual/vite.config.ts`.

Nothing here ships:

- `visual/` is not a bundler input: keep the production `vite.config.ts` building only the app entry.
- Exclude it from Tailwind scanning in the global stylesheet (`@source not "../visual";`).
- So `npm run build` and the production output never see it.

## Commands

Run from the client app folder (`clientAppDir`). `visual:compare` is the normal QA command.

| Command | What it does |
|---|---|
| `npm run visual:compare` | Every scenario. The baseline is `auto` (`git merge-base HEAD origin/main`, then `main`). |
| `npm run visual:compare -- orders-page-light,orders-page-dark` | Only the named scenarios (comma-separated). |
| `VISUAL_BASELINE_REF=HEAD npm run visual:compare -- <ids>` | Compares uncommitted changes against the last commit. |
| `npm run visual:check:scenario -- <ids>` | Captures only, with no baseline unless `VISUAL_BASELINE_REF` is set. |
| `npm run visual:check` | Every scenario, without a baseline. |
| `npm run visual:list` | Lists the scenarios Playwright would run. |
| `npm run visual:verdict -- <verdict.json> <bundle>` | Records the QA judgement, then regenerates `findings.md` and `index.html`. |
| `npm run visual:type-check` | Type-checks the harness. It is not part of `npm run build`. |
| `npm run visual:test` | Runs the findings/verdict contract tests (`node --test`). |
| `npm run visual:recheck -- <bundle> [<ids>]` | Correction recheck; see "Correction rounds". |
| `npm run visual:ids -- orders [--light\|--dark]` | Comma-joined ids of one screen, for `visual:compare`. |
| `npm run visual:measure -- <ids> --sel "<css>" [--props a,b]` | Opens the scenario exactly as captured (mocks, clock, theme, actions) and prints boxes, computed styles, focus state and SVG glyph bounds per selector. `--probe file.mjs` runs a custom `export default async (page, scenario) => json`; `--out` keeps the JSON. Never writes a bundle. **Use this instead of ad-hoc Playwright scripts.** |
| `npm run visual:crop -- <a.png> <b.png> x y w h [--scale 8]` | Same box from two images side by side, scaled up: open this, not full screenshots. |
| `npm run visual:attempt-diff -- <bundle> <id>` | What a correction changed between two attempts (changed pixels, bbox, diff PNG). |
| `npm run visual:prune [-- --yes]` | Drops git-ignored evidence of older bundles (keeps the newest per screen and every versioned file). |

First time on a machine: `npm install`, then `npx playwright install chromium`.

### Servers and ports

| Port | Server |
|---|---|
| 5175 | Visual preview server. Playwright starts it with `visual/vite.config.ts`, and reuses one already listening. |
| 5174 | Baseline preview server, run from the git worktree. Never reused. |
| 5173 | The normal `npm run dev` used by the ASP.NET app in Development. Not used by the harness, so both run side by side. |

To run the preview on another port, set `VISUAL_PORT=<port>`.

You do not need the backend running. The preview never reaches the API: every `/api/*` request is answered by a
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

`visual/preview.ts` (engine) mounts the scenario component with the production wiring supplied by
`visual/app-setup.ts` (project):

- `applyTheme(scenario)` runs BEFORE the component module loads: it writes the theme to `localStorage`,
  toggles the dark class/attributes on `<html>` and paints the body background, exactly as the host page's
  inline script does. This matters because theme composables usually read them at import time.
- `installApp(app, scenario)` registers PrimeVue (preset, `darkModeSelector`, locale), `ToastService` and any
  other global plugin, as `src/main.ts` does.
- `renderRoot(vnode, scenario)` wraps the component with the global elements the app shell hosts
  (for example `<Toast position="bottom-right" />`).
- The engine adds a memory router: a catch-all route, plus a stub per entry in `routeNames`.

The app shell (`App.vue`: sidebar, header, main paddings) is not mounted. A page component is narrower in
production than the viewport, so set `SHELL_HORIZONTAL_CHROME` in `scenarios/fixtures.ts` to the shell's
fixed horizontal widths and use `mountWidth: pageWidth(viewport.width)` to render pages at their real width.
To validate the shell itself, build a wrapper component in the scenario.

## Adding a scenario

1. Add the scenario to a file in `visual/scenarios/` and register the file in `scenarios/index.ts`. The
   type is `VisualScenario` (see `types.ts`); `scenarios/example.ts` is a compact example.
2. Import the real component with a relative path: `component: () => import('../../src/components/X.vue')`.
3. Declare **every** API call in `mocks`. Use the helpers in `scenarios/fixtures.ts`:
   - `pagedMock(apiUrl, items, pageSize, page?)` reproduces the API's paged response (shape in `paged()`).
   - `jsonMock(url, body, status?)` answers any other call (and error states with a 4xx/5xx status).
   - Group the calls a page makes on mount in one helper (e.g. `dashboardMocks()`).

   An undeclared `/api` call is aborted and listed as a blocked request in the report. That means a mock
   is missing, not that the harness failed.
4. Fixtures (`scenarios/fixtures/*.json`) are snapshots of the real API (for example taken at
   `pageSize=100`). Edit or filter them in the scenario to get other states, for example
   `pagedMock('/api/orders', [], 10)` for the empty state.
5. Add a dark sibling for every light scenario. `visual:verdict` blocks PASS when one is missing.
6. Wait for the real state before the screenshot:
   - Use `actions` (`expect-count`, `expect-text`, `click`, `fill`, `hover`, `wait`, …).
   - A page with an intro loader or animation needs an `actions` wait for its ready marker.
7. Set `captureSelector` to the component's own root. Screenshots are element screenshots.
8. Use `state: '<label>'` for non-default states (empty, loading, error, dialog). These scenarios are
   listed in the "Outros estados" tab and never fill the device × theme matrix.

### Determinism

| Setting | Value |
|---|---|
| Browser | Chromium |
| Timezone | `UTC` |
| Motion | `reducedMotion: 'reduce'`, and screenshots use `animations: 'disabled'`. Tweened numbers should land instantly (honour `prefers-reduced-motion`). |
| Device scale factor | 2 (default) |
| Clock | Browser `Date` is pinned to `fixedNow` (`visual/project.json`, override per scenario with `now`). Timers and `performance.now()` keep running. |
| Service workers | Blocked |
| External requests | Every request outside the preview origin is aborted |

Pinning the clock matters: a "last 12 months" chart or a "N days ago" label depends on *today*. Without a
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

For tablet/phone scope follow the project's responsive skill (`<project>-mobile-responsive`).

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
  report.json                 schema frontend-visual-check/6
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
compared with Figma therefore captures at `deviceScaleFactor: 1`; use `DESKTOP_1X` from `scenarios/fixtures.ts`.

Exports of a card node can carry 3–6px of drop shadow beyond the node's bounds. Export the parent frame
instead and crop each section at its node's `get_metadata` bounds. Record the crop in the spec `notes`.

## QA judgement and findings.md

Every capture writes `findings.md` with status **BLOCKED** until QA records a review.

To record one, write a verdict JSON and run `npm run visual:verdict -- <verdict.json> <bundle>`:

```json
{
  "result": "PASS",
  "criteria": [{ "text": "Requested state renders in both themes", "status": "pass",
    "evidence": ["actual/attempt-01/orders-page-light.png", "actual/attempt-01/orders-page-dark.png"] }],
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
