---
name: figma-refactor
description: "Read-only comparison of existing {{PROJECT_NAME}} Vue components with a figma-discovery report. Produces a scoped change plan; primevue-component-build performs the edits. Use when: a Figma URL targets UI that already exists (restyle, redesign, align to the design system, refactor a screen to Figma) - not for brand-new components."
argument-hint: "The figma-discovery report (or .figma-cache folder) and the existing component/page it targets"
---

# Figma Refactor

Owns design delta analysis only. Consumes the `figma-discovery` report (or its `.figma-cache/` folder) and the
target files under `{{CLIENT_APP_DIR}}/src/`. Does not fetch Figma again, edit files, or run a second
implementation workflow. Tasks without Figma go directly to `primevue-component-build`.

1. **Read the current UI.** Read the target components and their consumers, with
   `.github/instructions/frontend.instructions.md` (**Shared building blocks**, **Data access**). Identify the
   behavior the design does not describe: reusable children, props/emits/slots, composables, routes, and the
   loading/empty/error states.
2. **Compare** the full scoped tree of the discovery report with the implementation: structure, reused
   components, variants, layout/responsiveness, tokens, shared `pt` helpers, class constants, Lucide icons and
   assets. Separate observations (rendered evidence, Figma data) from assumptions read from source. Ask for a
   refreshed discovery only when it is incomplete or stale.
3. **Trace each change** to the affected files and consumers. Classify each meaningful element as `unchanged`,
   `reuse`, `update`, `create` or `remove` (from this view). Removing a node from the design never authorizes
   deleting a shared `common/` component or changing an unrelated consumer.
4. **Record gaps.** Missing data or interactions become integration gaps (`lacunas`). Figma sample content is not
   an API contract. Preserve real API data, server-side paging and the loading/empty/error behavior.
5. **Flag deviations.** Anything where matching Figma would break a contract or a shared component is an open
   question for the user, never a silent compromise.

Return only actionable deltas, dependencies and unresolved gaps:

| Node / element | Current implementation | Design change | Action | Affected files |
|---|---|---|---|---|

Then: a bottom-up implementation order (children before parents), the behavior/contracts to preserve, and the
open questions. Hand the plan to `primevue-component-build`; a comparison-only request ends here.
