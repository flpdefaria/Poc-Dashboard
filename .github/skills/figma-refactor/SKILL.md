---
name: figma-refactor
description: "Read-only comparison of existing CarStore Vue components with a refreshed figma-discovery report. Produces a scoped change plan; primevue-component-build performs the edits. Use when: a Figma URL targets UI that already exists (restyle, redesign, align to design system) - not for brand-new components."
argument-hint: "The figma-discovery report and the existing component/page it targets"
---

# Figma Refactor

Own design delta analysis only. Consume the report from `figma-discovery` and the target files under `Src/CarStore.Web/ClientApp/src/`. Do not fetch Figma again, edit files, or run a second implementation workflow. Tasks without Figma go directly to `primevue-component-build`.

1. Read the target components and their consumers under `.github/instructions/frontend.instructions.md`. Identify behavior the design does not describe: existing reusable children (`common/dialog`, `common/form`, `common/table/DataTableCommon.vue`, `common/pageheader`), props/emits/slots (`confirmDetails`/`confirmEdit`/`confirmDelete`), composables (`usePagedFetch`, `useEntityCrud`, `useCreateEntity`), routes, and loading/empty/error states.
2. Compare the full scoped tree from the discovery report with the current implementation: structure, reused components, variants, layout/responsiveness, tokens (`surface-*`, `text-color`, `bg-primary`…), shared `pt` helpers (`dialogShellPt`, `menuPt`, `paginatorPt`), class constants (`styles/buttonStyles.ts`), Lucide icons and assets. Use rendered evidence when supplied, and separate observations from assumptions read from source. Ask for a refreshed discovery only when it is incomplete or stale.
3. Trace each design change to the affected files and consumers. Classify each meaningful element as unchanged, reuse, update, create, or remove from this view. Removing a node from the design never authorizes deleting a shared `common/` component or changing an unrelated consumer.
4. Record missing data or interactions as integration gaps. Figma sample content is not an API contract. Preserve real `/api/*` data, server-side paging, and the loading/empty/error behavior.

Return only actionable deltas, dependencies and unresolved gaps:

| Node / element | Current implementation | Design change | Action / affected files |
|---|---|---|---|

Include a bottom-up order for affected children and the behavior/contracts to preserve. Hand the plan to `primevue-component-build`; a comparison-only request ends here.
