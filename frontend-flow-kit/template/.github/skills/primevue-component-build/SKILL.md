---
name: primevue-component-build
description: "Builds or updates Vue 3 SFC components in the {{PROJECT_NAME}} SPA with PrimeVue components, PrimeVue design tokens, Tailwind CSS v4 utilities and Lucide icons. Use when: implementing a new component/dialog/table/page (often right after figma-discovery / figma-refactor), or restyling an existing component to match the design system."
argument-hint: "The component to create/update and, if available, the figma-discovery report or figma-refactor plan"
---

# PrimeVue + Tailwind Component Build

The conventions themselves (placement, composables, tokens, `pt`, postfix `!`, Lucide slots, themes, shared
building blocks, "Never") live in `.github/instructions/frontend.instructions.md`. This skill is the procedure;
it does not repeat them. With a Figma task, start from the `figma-discovery` report (or its `.figma-cache/`
folder) and, for existing UI, the `figma-refactor` plan.

## Procedure

1. **Find the analogue.** Open the closest existing component (sibling page, table, dialog) and the shared pieces
   it uses (composables, class strings, `pt` helpers, form fields, formatters). Extend them; never copy a class
   string, `pt` object or fetch/loading/error block.
2. **Place the file** per "Folder layout" in the instructions. A new page = a route + `<Feature>Page.vue` + a nav
   item.
3. **Check APIs in the PrimeVue MCP** (props, `pt` section names, slots, events) instead of guessing. If the MCP
   is unavailable, say the verification is blocked; never claim it was verified.
4. **Implement**: tokens for color, `pt` for PrimeVue internals, Tailwind for layout (arbitrary values when Figma
   is off-scale), Lucide icons through slots, server-side paging, API errors in `<Message severity="error">`,
   DTO types in sync with the backend. Charts go through `echarts-chart-build`; widths below desktop through
   `mobile-responsive`.
5. **Verify** in `{{CLIENT_APP_DIR}}`: `npm run verify` (`vue-tsc --noEmit` + `check:conventions` + `vite build`).
   Fix every reported line; `check:conventions` prints file, line and rule. Run `{{BACKEND_BUILD_CMD}}` if a DTO
   changed. Commit the rebuilt bundle with the change when the project commits it.
6. **Check both themes** in the running app (`{{APP_URL}}`) when it is available; otherwise list it as not
   verified.
7. **Report** the components changed, the Figma node, new token mappings or shared helpers, and the deviations
   from Figma that need the user's approval, so the caller records them with `vault-write`.

## Rules

- Do not change `vite.config.ts`, `package.json`, `tsconfig.json`, the app bootstrap or the MCP config files:
  that is `frontend-tooling-specialist` scope.
- Never invent prop/emit names, endpoints or file locations; read the code.
- Never skip step 5.
