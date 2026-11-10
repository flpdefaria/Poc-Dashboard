---
name: frontend-visual-check
description: "Validate the running CarStore SPA against text requirements and optional Figma evidence by driving it with the Playwright MCP (msedge). Captures states, widths and both themes, judges every difference, and writes a reviewed qa-results/<run>/findings.md. Use when: validating a frontend delivery, checking a screen/dialog/table visually, comparing with a Figma frame, or rechecking after a correction round. Never edits production code."
argument-hint: "Requirements, delivery summary or changed files, optional Figma URL, optional existing run path for a recheck"
---

# Frontend Visual Check

Own capture and review only. `Src/**`, `wwwroot/dist` and configuration stay read-only. Conventions to judge against live in `.github/instructions/frontend.instructions.md` and `.github/instructions/web.instructions.md`.

## Environment

| Item | Value |
|---|---|
| App URL | `http://localhost:5045` (launch profile `http`) |
| Routes | `/`, `/cars`, `/brands`, `/customers` |
| Health check | `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5045/` |
| Build bundle | `npm run build` in `Src/CarStore.Web/ClientApp` (not part of `dotnet build`) |
| Start app | `dotnet run --project Src/CarStore.Web --launch-profile http` (background) |
| Data | EF Core In-Memory + `Src/CarStore.Domain/Seed/DataSeeder.cs`; restart restores the seed |
| Theme | `app-dark` class on `<html>`, persisted in `localStorage["carstore-theme"]` |
| Browser | Playwright MCP (`.mcp.json`), msedge; raw output in git-ignored `.playwright-mcp/output/` |

- If the app is down, build and start it. If it is up but ClientApp files changed after the last build, rebuild (the server serves `wwwroot/dist`, not Vite). An exact failing command is a blocker.
- The seed is the deterministic fixture. Create/Edit/Delete scenarios mutate it until restart: run read-only scenarios first, and record what you changed. Never seed data another way, and never put fixtures in production code.
- To switch theme, run `localStorage.setItem('carstore-theme','dark')` with `browser_evaluate` and reload, or click the sidebar toggle when the toggle itself is under test.

## Evidence and scenarios

1. Require requirements plus a delivery summary (`arquivos`, `componentes`, `estados`, `larguras`, optional `figma`, `lacunas`) or a changed-file list. Missing scope is BLOCKED.
2. Turn requirements into scenarios: id, route, state (default, loading, empty, error, dialog open, validation error, after create/edit/delete, sidebar collapsed/expanded), width, theme, expected outcome. Default widths are 1440 and 390, plus any width the delivery or a Figma frame names. For responsive scope, follow `carstore-mobile-responsive`. Every state/width gets a light and a dark capture.
3. With a Figma URL, collect the frame screenshot and design context via `figma-discovery`, and save the PNG to `qa-results/<run>/references/<scenario>.png`. Expected values come only from Figma, never from the current DOM. Use the PrimeVue MCP to confirm the relevant component props/slots/`pt`. A missing required design access is BLOCKED, and a render is never promoted to a reference.
4. Without Figma, encode text, counts and measurable values as explicit checks, and list the remaining criteria for screenshot review. Figma parity is `not-applicable`, but requirements can still pass.

## Capture

For each scenario: `browser_resize` → `browser_navigate` → reach the state (`browser_click`, `browser_type`, `browser_fill_form`, `browser_wait_for`), then:

- `browser_snapshot` for structure, text, counts and accessible names (the source of measurable checks).
- `browser_take_screenshot` of the element under test, or full page when the layout is the requirement. Copy every cited image to `qa-results/<run>/evidence/<scenario>-<width>-<theme>.png`.
- `browser_console_messages` and `browser_network_requests`: console errors and failed `/api/*` calls are findings.
- `browser_evaluate` for asserted spec values: computed color/spacing/radius, overflow (`scrollWidth > clientWidth`), and hit areas of at least 44×44px on phone for controls the delivery added or changed.

## Review

- Inspect every screenshot yourself. A capture alone is not a verdict. Distinguish intended changes from regressions, comparing with the previous behavior when the delivery claims none.
- Classify each difference as `defeito`, `decisao-design`, `backend`, `artefato-ferramenta`, `intencional` or `conteudo-dinamico`, and leave none unclassified. Explanations never change expected values.
- Check the conventions too: Lucide icons only (no `pi pi-*` / `bi-*`), no Bootstrap classes, `surface-*`/semantic tokens instead of hardcoded grays, and readable dark contrast.

## Minimal differences

Judge perceptibility and effect on the requested outcome. Small anti-aliasing, sub-pixel or font-rendering deltas are similar; when uncertain, treat a difference as minimal. Record it in `minimas[]`, never as `defeito`. Minimal differences do not fail the run or request correction. Do not invent numeric thresholds or loosen checks to hide errors.

These are never minimal: missing or extra elements, wrong text or counts, broken states, overflow or broken layout, unreadable dark contrast, console errors, failed API calls, or an error repeated across the screen. Missing evidence is never minimal.

## Findings and delivery

Write `qa-results/<YYYY-MM-DDTHH-MM>__<slug>/findings.md` with relative links:

- `status`: PASS / FAIL / BLOCKED, grounded in this run's evidence.
- `ambiente`: URL, `git rev-parse --short HEAD`, whether the bundle was rebuilt, browser.
- `cenarios[]`: id, route, state, width, theme, evidence image.
- `diferencas[]`: stable id, scenario, element/selector, expected (requirement or Figma value), actual, category, evidence.
- `minimas[]`: accepted small differences with evidence and rationale (informational).
- `bloqueios`: untested requirements, missing prerequisites, exact failed commands.
- `dados-alterados`: entities created/edited/deleted during the run.

Rechecks reuse the same run folder: append `## Tentativa NN` and keep earlier evidence. PASS requires review of all requested evidence, with no unresolved defects and no required blockers. FAIL names real defects. BLOCKED records required checks that could not execute; continue with independent checks. Return the run path, the `findings.md` path and a concise outcome.
