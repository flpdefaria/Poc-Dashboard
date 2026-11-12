---
name: frontend-visual-check
description: "Validate {{PROJECT_NAME}} Vue renders against text requirements and optional Figma PNG/spec evidence with the committed Playwright harness ({{CLIENT_APP_DIR}}/visual), comparing previous (base commit) × current × Figma. Produces reviewed findings and an offline qa-results bundle (index.html, report.json, findings.md). Use when: validating a frontend delivery, checking a screen/dialog/table visually, comparing with a Figma frame, or rechecking after a correction round. Never edits production code."
argument-hint: "Requirements, delivery summary or changed files, optional Figma URL, optional existing run path for a recheck"
---

# Frontend Visual Check

You own test scaffolding, capture and review only. Everything outside `{{CLIENT_APP_DIR}}/visual/**` and
`qa-results/` stays read-only.

Read before adding scenarios:

- `{{CLIENT_APP_DIR}}/visual/README.md`: commands, ports, schema, status tables, baseline mechanics, report tabs,
  verdict rules.
- `visual/references/README.md`.
- `.github/instructions/frontend.instructions.md`: the conventions to judge against.

## Environment

| Item | Value |
|---|---|
| Working dir | `{{CLIENT_APP_DIR}}` |
| First run on a machine | `npm install`, then `npx playwright install chromium` |
| Capture | `npm run visual:compare -- <ids>` |
| Recheck (after a correction) | `npm run visual:recheck -- <bundle>`: see **Recheck mode** |
| Explicit base | `VISUAL_BASELINE_REF=<ref>`; `HEAD` for uncommitted changes; `auto` = merge-base with `main` |
| Verdict | `npm run visual:verdict -- <verdict.json> <bundle>` |
| Ids of a screen | `npm run visual:ids -- <screen>` |
| Fine measurement | `npm run visual:measure -- <ids> --sel "<css>"` (or `--probe`). Never hand-write Playwright scripts. |
| Zoomed comparison | `npm run visual:crop -- <ref.png> <actual.png> x y w h` |
| What a fix changed | `npm run visual:attempt-diff -- <bundle> <id>` |
| Servers | The harness starts its own preview (5175) and baseline (5174) servers; it needs neither the backend nor `npm run dev`. |
| Data | Fixtures in `visual/scenarios/fixtures/*.json`, served through mocks. Every undeclared API call is aborted. |
| Theme | `theme: 'dark'` on the scenario; `visual/app-setup.ts` applies it the way the real app does. |
| Clock | Pinned (`fixedNow` in `visual/project.json`); override per scenario with `now`. |

## Evidence and scenarios

1. **Scope.** Require requirements plus a delivery summary (`arquivos`, `componentes`, `estados`, `larguras`,
   optional `figma`, `lacunas`) or a changed-file list. Missing scope is BLOCKED.
2. **With Figma.** Read the `.figma-cache/<fileKey>/<node>/` folder first (the implementer usually filled it);
   call `figma-discovery` / the Figma MCP only for what it lacks. Reuse existing `visual/references/<id>.png` +
   `.figma.json` for the same node.
   - Save `visual/references/<id>.png` at the scenario's DPR, cropped to the `captureSelector` element.
   - Save `<id>.figma.json` following the `FigmaSpec` contract in `visual/types.ts`; set `figmaNode`.
   - Expected values come only from Figma, never from the current DOM. Never promote a render to a reference.
   - Verify PrimeVue mappings through the PrimeVue MCP.
   - Missing required design access is BLOCKED.
3. **Without Figma.** Encode text, counts and measurable requirements as `renderChecks`. Record the remaining
   visual/interaction criteria for screenshot review. Do not set `figmaNode`.
4. **Register the scenarios** under `visual/scenarios/` in `scenarios/index.ts`, rendering the real components.
   Mock every API call with the `fixtures.ts` helpers (`jsonMock`, `pagedMock`, ...). Reach states with `actions`
   (open dialogs, validation, search, sort, hover); mark non-default states with `state` (empty, error, loading,
   dialog). Fixtures never enter production code.
5. **Widths and themes.** Every state/width gets a dark sibling. Below desktop, follow `mobile-responsive` and add
   `responsiveCheck: { minTouchTarget: 44 }`.
6. **Shell coverage.** The preview mounts one component without the app shell. Record that limit, or wrap the
   component in the scenario when the requirement is the shell itself.
7. **Dynamic height.** Use section references for content-dependent heights (README). Never resize screenshots,
   hide layout defects as dynamic data, or fill expected values from actual measurements.

## Capture and review

- Run `npm run visual:compare -- <ids>` and record the base ref and commit. "Before" is the base commit rendered
  from a temporary git worktree with the same mocks and clock.
- Inspect economically: a section diff or crop before a full screenshot. Never open every evidence file.
- Per scenario, inspect the screenshots, the previous | current | Figma triptych, the spec checks,
  `<id>.requirements.json` and `<id>.responsive.json`.
- Distinguish intended changes from regressions. A mismatch percentage alone is not a verdict.
- Classify each failing/missing/dynamic spec row and failing section through `explanations` until
  `nao-classificado` is zero. Categories: `defeito`, `decisao-design`, `backend`, `artefato-harness`,
  `intencional`, `conteudo-dinamico`. Explanations never change expected values.
- Conventions: `npm run check:conventions -- <changed files>`; judge dark contrast on the captures.

### Recheck mode (correction rounds)

Given an existing bundle and a correction summary, do only this (no README, vault, Figma or scenario steps):

1. `npm run visual:recheck -- <bundle>` (or `<bundle> <ids>` when the correction touched other scenarios).
2. Read the printed JSON; open only the images in `abrir[]`.
3. Classify the `persiste` and `novas` items in `verdictDraft`, then
   `npm run visual:verdict -- <verdictDraft> <bundle>`.
4. Return `qaFindings.status`, the bundle path and the remaining `defeito` ids.

Change a scenario only when a reported selector broke.

### Live app (optional)

Flows that need the real backend (create/edit/delete round-trips, server validation) can be checked on
`{{APP_URL}}` with the Playwright MCP (raw output in `.playwright-mcp/output/`). Copy cited images into the bundle
under `evidence/` and reference them with a `manual:` finding. Run mutating flows after the read-only checks and
list changed data in `notes`.

## Minimal differences

Judge perceptibility and effect on the requested outcome. Anti-aliasing, sub-pixel and font-rendering deltas are
minimal; when uncertain, treat as minimal. Record them in `minimas[]`, never as `defeito`; they never fail the run.
Never invent numeric thresholds or loosen checks.

Never minimal: missing/extra elements, wrong text or counts, broken states, overflow, unreadable dark contrast,
console errors, blocked or failed API calls, an error repeated across the screen, missing evidence.

## Findings and delivery

Write the verdict JSON (`criteria`, `diferencas`, `minimas`, `bloqueios`, `notes`; format in the README) and run
`npm run visual:verdict -- <verdict.json> <bundle>`. It generates `findings.md`, updates `report.json` and
regenerates `index.html`. Re-record after every attempt.

The CLI downgrades a requested PASS when evidence is missing, a dark sibling is missing, a declared Figma node lacks
its PNG/spec, or an item stays unclassified. Read `qaFindings.status`, not the exit code.

| Field | Content |
|---|---|
| `status` | PASS / FAIL / BLOCKED, grounded in this run's evidence |
| `base` | Base ref and commit |
| `diferencas[]` | Stable id, scenario, element/selector, expected (requirement or Figma), actual, category, image |
| `minimas[]` | Accepted small differences with evidence and rationale (informational) |
| `bloqueios` | Untested requirements, missing prerequisites, exact failed commands |

Confirm the evidence links and the offline `index.html` open. Return the run path, `findings.md`, `index.html`
and a concise outcome. Git versions only the judgement (`findings.md`, `report.json`, `index.html`,
`recheck-summary.json`); screenshots stay local. Measurement traps go to `visual/LEARNINGS.md` by topic.
