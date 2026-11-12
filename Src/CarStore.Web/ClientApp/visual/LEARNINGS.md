# Visual harness pitfalls

Measurement traps found in real QA runs, grouped by topic. **Not required reading**: open the matching
section only when a check, capture or measurement looks wrong. The how-to is in `README.md`.
Add a new trap to its topic (one bullet, the fix first), never as a dated log.

## Selectors and spec rows

- **Spec selectors are CSS.** `.figma.json` `checks[].selector` goes through `querySelector`, so Playwright-only syntax
  (`:has-text()`, `>> nth=`) reports `missing-element`. Use classes, `:nth-child`, `:has()` or attributes. `renderChecks`
  and `actions` do accept Playwright selectors.
- **Spec rows only cover what someone wrote.** Pull the frame's component variables with `get_variable_defs` and add a row
  for each visible state (unchecked border, check icon, select chevron), not only the one the delivery touched.
- **An icon box row does not check the glyph.** Compare the Figma vector bounds (`get_metadata` on the icon instance) with
  the `glyph` that `visual:measure --sel "<svg selector>"` prints (`withStrokePx` already adds the stroke to Lucide's centreline).
- **Spec rows do not check position inside a cell.** Compare the `get_metadata` slot `y` with `child.top - row.top` and
  count diff pixels in the column (an `inline-flex` checkbox with `vertical-align: bottom` lands 1px low).
- **`strokeWidth` rows read viewBox units.** Use `glyph.renderedStrokePx` from `visual:measure`. Lucide
  `absoluteStrokeWidth` divides by the `size` prop (default 24), not the CSS size.
- **Inline `transform-origin` is serialised**: PrimeVue writes `bottom`, Chromium reads back `center bottom`.
- **Spec `explanations` classify rows automatically** in every later run. When the acceptance policy changes, remove the
  entries (expected values stay Figma's) and classify in the verdict.

## PrimeVue and Lucide specifics

- **PrimeVue styles beat Tailwind.** PrimeVue injects unlayered CSS; Tailwind v4 utilities live in `@layer utilities`, so a
  `pt` class without `!` loses when the theme sets the same property. Suspect this first when a measured value equals the
  PrimeVue default (dialog insets, menu width, paginator button size).
- **Selected rows:** with `selectionMode="multiple"`, `p-datatable-row-selected` appears only with `highlightOnSelect`.
  Target `tr[data-p-selected="true"]`.
- **A `pt` key is dead when a slot replaces its element** (Menu `#itemicon` gets only `cx('itemIcon')`). Check the
  element's real `class` before trusting a `pt` fix.
- **`@lucide/vue` 1.71: `Trash` is the old `Trash2`** (5 paths). Check the rendered path count, not the import name.
- **`@lucide/vue` 1.71 `IdCard` is redrawn** (circle r3 at 9,12 + shoulder arc down to the card edge); Figma libraries still draw the
  older glyph (small head r2 + short arc). Same name, different pixels: crop the icon box before calling it a wrong icon.
- **Dialog autofocus:** PrimeVue Dialog focuses the close button when nothing has `[autofocus]`, so a `:focus-visible`
  ring shows in every dialog capture. Spec rows cannot see `outline`; measure it.
- **Aura focus-visible replaces the box border** on checkboxes: read both outline and border.
- **Figma strokes sit outside auto layout.** A 1px stroke + 4px padding is 4px from the edge in Figma; in CSS the border
  adds 2px unless the padding drops to 3px.

## Overlays, timing and state

- **Capture popups/dialogs by their own root** (`.p-menu-overlay`, `.p-dialog`) and crop Figma at the overlay's
  `get_metadata` bounds. Toasts need a `body` capture.
- **DatePicker panel stays open after `fill`** and intercepts footer clicks; click the typed day in `.p-datepicker-panel` to close it. Esc closes the whole dialog, and clicking another label does not close the panel.
- **Popups close on scroll.** Size the viewport so the capture fits (`cars-row-menu-flip` uses 1440x760).
- **Move the pointer off the trigger** (`hover` on `h1`) after opening a row menu, or the capture shows the row hover.
- **Focus/hover colours need ~600ms.** Aura's 0.2s `border-color` transition ignores `reducedMotion` (`visual:measure` waits 600ms).
- **Keyboard focus on a checkbox needs a real Tab sequence** from the search input until `document.activeElement` is a
  `.p-checkbox-input`.
- **Success toasts appear before the reload.** Wait for the reloaded rows (`expect-text`), not the toast.

## Mocks and data

- **A new endpoint needs a mock in every scenario of that page**, or the call is aborted and the page reports a render
  error (`CustomersPage` + `/api/cars/options`).
- **Whole-screen comparison for PASS:** data-driven sections make a scenario `partial`. Prefer a prototype-content fixture
  (`scenarios/fixtures-figma.ts`) and classify the residual pixel diff.
- **Mocks match the URL only**, regardless of method. `/\/api\/cars$/` catches only the POST (the list GET has a query
  string); `/\/api\/cars\/\d+$/` catches PUT and DELETE. `{ status: 400, body: { message } }` reproduces a
  `DomainException`.
- **Delete flows need `responses: [before, after]`** on the list mock (`listAfterDelete` in `scenarios/cars-figma.ts`);
  a static mock returns the deleted ids, which stay invisible under `row-fx-leaving`. Page 1 refills to `pageSize`.
- **Figma sample rows may skip seed rows** (Cars drops "Corolla"). Filter the fixture so the diff measures layout.
- **Search is current-page only**; with no `#empty` slot the no-result state is a blank `.p-datatable-empty-message` row.

## Geometry and pixel rounding

- **Figma colours:** take expected colours from `get_variable_defs` (resolved); hexes in `get_design_context` are fallbacks.
- **`baselineActions` go stale when the base gains the flow** (or a redesign drops the ids it types into, giving `baseline bloqueado`, which blocks PASS). Update them, then move `baseline/<id>.*` into `baseline/history/` so the next attempt recaptures instead of reusing.
- **Baseline geometry** must match the capture (viewport, DPR, mount width, theme, root) or it is recaptured; never
  compare a DPR 2 baseline with a DPR 1 capture. The preview uses the app's `DEFAULT_SURFACE_MODE`.
- **Half-pixel positions:** a centred 487px dialog on a 900px viewport sits at y=206.5 and captures 488 rows
  (`dimension-mismatch`). Use an odd viewport height (1440x901).
- **Popup gaps on a y = n.5 trigger** round to 4.5/3.5px. Judge "4px" as ±0.5px and check for overlap instead.
- **Half-pixel Figma edges** anti-alias across 2 rows; Chromium snaps to 1 (~19 red px per box). Compare with the header
  residual before calling it a position defect.
- **Dimension fixes surface the pixel diff**: once the size matches, new pixel rows appear and need classifying. Cluster
  the red pixels in `*.diff.png` first.
- **Icon weight:** sum the ink (`255 - G` above 20) for the icon and for one already judged equal; a ratio far from 1
  means the stroke weight differs even when the bbox matches.
- **Attempt-to-attempt diff** (`npm run visual:attempt-diff -- <bundle> <id>`, delta above 8 per channel) isolates what a fix
  changed; deltas up to 8 on dark toast/backdrop captures are noise. For pages the delivery should not touch it beats a
  diff against the base.

- **Dialog node exports (`get_screenshot` of a 400px dialog) are 440px wide**: shadow-xl adds 20px left/right and 40px below, none above. Crop at x20 y0 with the node size.

## Verdict classification

- **A spec without a PNG is `partial` and blocks PASS even without `figmaNode`** (`findings.mjs`). A downscaled cache export
  (Figma MCP >1024px frames) cannot be used either: re-export at 1x, never rescale.

- Only padding, margin, gap, radius and letter-spacing spec rows can go in `minimas`. `dimension-mismatch`, sub-pixel
  `width` rows and `manual:` ids need an explicit category (or a criterion with measured values).
- `artefato-harness` downgrades any verdict to BLOCKED.

## Console and measurement tooling

- **API contract tests use their own port** (`--urls http://localhost:5046`); 5045 may be the developer's instance.
- **Vue warnings never reach `report.json`** (console errors only). Grep the run log for `Vue warn`, but a clean grep is
  proof only if the log carries `[console.*]` lines; otherwise use a page `console` listener and a probe `console.warn`.
- **Measurements reuse the preview on 5175** (`visual:measure` starts or reuses it); run them after `visual:compare`
  finishes, or set `VISUAL_PORT` for a second preview.
- **Glyph-level checks:** `npm run visual:crop` (pngjs; there is no PIL).
- **Id list for one screen:** `npm run visual:ids -- cars`.

## Guard scenarios

- `scenarios/legacy-dialogs.ts`: legacy dialog shell on Customers delete (Brands moved to `scenarios/brands-figma.ts`).
- `scenarios/cars-second-pass.ts`: row menu states, paginator hover, rows per page, Customers menu guard.
- `scenarios/selection-guards.ts`: non-card DataTableCommon path on Customers (checkbox, selected row, active page).
- `scenarios/cars-search.ts`: case-insensitive match and no-result state.
