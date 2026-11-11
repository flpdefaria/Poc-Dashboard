---
name: frontend-visual-check
description: "Validate CarStore Vue renders against text requirements and optional Figma PNG/spec evidence with the committed Playwright harness (Src/CarStore.Web/ClientApp/visual), comparing previous (base commit) × current × Figma. Produces reviewed findings and an offline qa-results bundle (index.html, report.json, findings.md). Use when: validating a frontend delivery, checking a screen/dialog/table visually, comparing with a Figma frame, or rechecking after a correction round. Never edits production code."
argument-hint: "Requirements, delivery summary or changed files, optional Figma URL, optional existing run path for a recheck"
---

# Frontend Visual Check

You own test scaffolding, capture and review only. `Src/**` (except `Src/CarStore.Web/ClientApp/visual/**`),
`wwwroot/dist` and configuration stay read-only.

Read these before adding scenarios:

- `Src/CarStore.Web/ClientApp/visual/README.md`, which owns the commands, ports, schema, status tables,
  baseline mechanics, report tabs and verdict rules.
- `visual/references/README.md`.
- `.github/instructions/frontend.instructions.md` for the conventions to judge against.

## Environment

| Item | Value |
|---|---|
| Working dir | `Src/CarStore.Web/ClientApp` |
| First run on a machine | `npm install`, then `npx playwright install chromium` |
| Capture | `npm run visual:compare -- <ids>` |
| Recheck | `QA_RUN_DIR=<bundle> npm run visual:compare -- <ids>` |
| Explicit base | `VISUAL_BASELINE_REF=<ref>`. Use `HEAD` for uncommitted changes; `auto` is the merge-base with `main`. |
| Verdict | `npm run visual:verdict -- <verdict.json> <bundle>` |
| Servers | The harness starts its own preview server (5175) and a baseline server (5174). It does not need `dotnet run` or the normal `npm run dev` (5173). |
| Data | Snapshots of the seeded API in `visual/scenarios/fixtures/*.json`, served through mocks. Every undeclared `/api` call is aborted. |
| Theme | `theme: 'dark'` on the scenario. The preview sets `carstore-theme`, `app-dark` and `data-surface` as `_Layout.cshtml` does. |
| Clock | Pinned to `FIXED_NOW` (`visual/lib/config.ts`). Override per scenario with `now`. |

## Evidence and scenarios

1. **Scope.** Require text/design requirements and a delivery summary (`arquivos`, `componentes`,
   `estados`, `larguras`, optional `figma`, `lacunas`) or a changed-file list. Identify the components,
   states, widths and expected outcomes. Missing scope is BLOCKED.
2. **With Figma.** Use `figma-discovery` and the Figma MCP for the metadata, design context, variables,
   Code Connect and the screenshot.
   - Save `visual/references/<id>.png` at the scenario's DPR, cropped to the `captureSelector` element.
   - Save `<id>.figma.json` following the `FigmaSpec` contract in `visual/types.ts`, and set `figmaNode`
     on the scenario.
   - Expected values come only from Figma, never from the current DOM.
   - Verify PrimeVue mappings through the PrimeVue MCP.
   - Missing required design access is BLOCKED. Never promote a render to a reference.
3. **Without Figma.** Encode text, counts and measurable requirements as `renderChecks`. Record the
   remaining visual and interaction criteria for screenshot review. Figma parity stays `not-applicable`,
   but the requirements can still pass. Do not set `figmaNode`.
4. **Register the scenarios.** Put the real components under `visual/scenarios/` and register them in
   `scenarios/index.ts`.
   - Use the `fixtures.ts` helpers: `pagedMock`, `jsonMock`, `homeMocks`, `pageWidth`.
   - Mock every API call the component makes.
   - Reach states with `actions`: dialogs open, validation errors, search, sort, hover/focus tooltips.
   - Use `state` for non-default states: empty, error, loading, dialog.
   - Fixtures never enter production code or call a real backend.
5. **Widths and themes.** Every state/width gets a dark sibling. Desktop scenarios use `DESKTOP` with
   `mountWidth: pageWidth(1440)`. For tablet/phone scope, follow `carstore-mobile-responsive` and add
   `responsiveCheck: { minTouchTarget: 44 }`.
6. **Shell coverage.** The preview mounts the view without `App.vue` (no sidebar). Record that coverage
   limit, or build a wrapper component in the scenario when the requirement is the shell itself (sidebar,
   nav rail).
7. **Dynamic height.** Use section references for content-dependent heights, following the README. Do not
   resize screenshots, hide layout defects as dynamic data, or fill expected values from actual
   measurements.

## Capture and review

- Run `npm run visual:compare -- <ids>` and record the base ref and commit. The "before" image is the base
  commit rendered from a temporary git worktree with the same mocks and clock.
- Rechecks reuse the same `QA_RUN_DIR` and append attempts. Keep the earlier evidence and the baseline.
- Inspect, for every scenario:
  - the actual screenshots
  - the previous | current | Figma triptych
  - the spec checks
  - `<id>.requirements.json`
  - `<id>.responsive.json`
- Distinguish intended changes from regressions. A capture count or a mismatch percentage alone is not a
  verdict.
- Classify each failing, missing or dynamic spec row and each failing section through `explanations`
  until `nao-classificado` is zero. The categories are `defeito`, `decisao-design`, `backend`,
  `artefato-harness`, `intencional` and `conteudo-dinamico`. Explanations never change expected values.
- Check the conventions too:
  - Lucide icons only (no `pi pi-*` / `bi-*`).
  - No Bootstrap classes.
  - `surface-*`/semantic tokens instead of hardcoded grays.
  - Readable dark contrast.

### Live app (optional)

Flows that need the real backend (create/edit/delete round-trips, server validation, toasts after
`SaveChangesAsync`) can be checked on `http://localhost:5045` with the Playwright MCP. Raw output goes to
`.playwright-mcp/output/`.

Copy any cited image into the bundle under `evidence/`, and reference it from the verdict with a `manual:`
finding or a criterion. Mutating flows change the in-memory seed until restart, so run them after the
read-only checks and list the changed data in `notes`.

## Minimal differences

Judge perceptibility and effect on the requested outcome, for pixels and spec alike. Small anti-aliasing,
sub-pixel or font-rendering deltas count as similar; when uncertain, treat a difference as minimal.

Record minimal differences in `minimas[]`, never as `defeito`. They do not fail the run or request
correction. Do not invent numeric thresholds or loosen checks to hide errors.

These are never minimal:

- missing or extra elements
- wrong text or counts
- broken states
- overflow or broken layout
- unreadable dark contrast
- console errors
- blocked or failed API calls
- an error repeated across the screen
- missing evidence

## Findings and delivery

Write the verdict JSON (`criteria`, `diferencas`, `minimas`, `bloqueios`, `notes`; format in the README).
Run `npm run visual:verdict -- <verdict.json> <bundle>` with the explicit run path. It generates
`findings.md`, updates `report.json` and regenerates the offline `index.html`. Re-record the verdict after
every attempt.

The CLI downgrades a requested PASS when evidence is missing, a dark sibling is missing, a declared Figma
node lacks its PNG/spec, or an item stays unclassified. Read `qaFindings.status`, not the exit code.

The findings contract:

| Field | Content |
|---|---|
| `status` | PASS / FAIL / BLOCKED, grounded in this run's evidence. |
| `base` | Base ref and commit. |
| `diferencas[]` | Stable id, scenario, element/selector, expected (requirement or Figma value), actual, category, evidence image. |
| `minimas[]` | Accepted small differences with their evidence and rationale. Informational only. |
| `bloqueios` | Untested requirements, missing prerequisites, exact failed commands. |

PASS requires review of all requested evidence, with no unresolved defects and no required blockers. FAIL
names real defects. BLOCKED records required checks that could not execute; continue with the independent
checks.

Before returning, confirm that the relative evidence links and the offline `index.html` open. Return the
run path, the `findings.md` path, the `index.html` path and a concise outcome.

Run bundles under `qa-results/` are reviewable repository artifacts. The root `qa-results/index.html` and
`.current-run` are machine-local and git-ignored. Put harness learnings in `visual/README.md`, and
reusable operational findings in the vault through `vault-write`.
