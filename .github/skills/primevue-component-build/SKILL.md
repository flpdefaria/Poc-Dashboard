---
name: primevue-component-build
description: "Builds or updates Vue 3 SFC components in the CarStore SPA with PrimeVue components, PrimeVue design tokens, Tailwind CSS v4 utilities and Lucide icons. Use when: implementing a new component/dialog/table/page (often right after figma-discovery), or restyling an existing component to match the design system."
argument-hint: "The component to create/update and, if available, the figma-discovery report for it"
---

# PrimeVue + Tailwind Component Build

The conventions themselves (placement, new-entity file set, composables, tokens, `pt`, postfix `!`,
Lucide slots, light/dark rules, shared building blocks, "Never") live in
`.github/instructions/frontend.instructions.md`. This skill is the procedure; it does not repeat them.
With a Figma task, start from the `figma-discovery` report (or its `.figma-cache/` folder).

## Procedure

1. **Find the analogue.** Open the closest existing component (sibling page, table, dialog) and the shared
   pieces it uses (`composables/`, `styles/buttonStyles.ts`, `common/dialog/dialogStyles.ts`,
   `DataTableCommon.vue`, `FormField`/`DetailField`, `PageHeader`, `utils/format.ts`). Extend them; never
   copy a class string, `pt` object or fetch/loading/error block.
2. **Place the file** per "Folder layout" / "Adding a new entity". A new page is a route in
   `router/index.ts` + `<Feature>Page.vue` + a nav item in `Sidebar.vue`.
3. **Check APIs in the PrimeVue MCP** (component props, `pt` section names, slots) instead of guessing.
   If the MCP is unavailable, say the verification is blocked.
4. **Implement**: tokens for colour, `pt` for PrimeVue internals, Tailwind for layout (arbitrary values
   when Figma is off-scale), Lucide icons through slots, server-side paging, API errors in
   `<Message severity="error">`, `types.ts` in sync with the C# DTOs. Charts go through `echarts-chart-build`.
5. **Verify** in `Src/CarStore.Web/ClientApp`: `npm run verify` (`vue-tsc --noEmit` + `check:conventions`
   + `vite build`). Fix every reported line; `check:conventions` lists the file, line and rule. Run
   `dotnet build Src/CarStore.slnx` if an API DTO changed. Commit the rebuilt `wwwroot/dist` with the change.
6. **Report** the components changed, the Figma node, new token mappings or shared helpers, so the caller
   (or the orchestrator, once per ticket) records them with `vault-write`.

## Rules

- Do not change `vite.config.ts`, `package.json`, `tsconfig.json`, the bootstrap in `main.ts` or the MCP
  config files from this skill: that is Frontend-Tooling-Specialist's scope.
- A new mount point or Razor view is never needed; a global store (Pinia) is a tooling proposal, not this
  skill's call.
- Never skip step 5.
