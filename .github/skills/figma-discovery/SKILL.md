---
name: figma-discovery
description: "Discovers and extracts design specs from Figma for a Vue/PrimeVue front-end. Use when: the user gives a Figma URL or node reference, asks to implement/match a design, refactor existing UI to align with the design system, or a new/changed component needs accurate spacing, color, typography or assets from Figma before coding. Parses Figma URLs, calls the Figma MCP tools, and maps raw values to the codebase's existing PrimeVue/Tailwind design-token conventions instead of raw hex/pixel values."
argument-hint: "A Figma URL or node reference, and what component/page it's for"
---

# Figma Discovery

Extracts an implementable spec from a Figma design BEFORE any component code is written or changed. Never
guess colors, spacing, or structure from a screenshot alone - always pull the real node data through the
Figma MCP server, then translate it into the codebase's existing PrimeVue + Tailwind conventions.

Output of this skill is a **discovery report**, not code. Hand it to `/primevue-component-build`.

## Required setup

- `.mcp.json` (Claude Code) and `.vscode/mcp.json` (Copilot) must both contain the `figma-mcp` server (`{ "type": "http", "url": "https://mcp.figma.com/mcp" }`). If it is missing or malformed, stop and say this is Frontend-Tooling-Specialist's responsibility - do not add it from this skill.
- The remote server requires the user to be signed into Figma and to approve the OAuth prompt in the IDE. If tool calls return an auth/permission error, ask the user to re-authenticate; never fall back to inventing values.
- Figma MCP tools used: `get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs`, plus whatever design-system search the server exposes. Tool names are prefixed per host (e.g. `mcp__figma-mcp__*` in Claude Code) - list the available tools rather than assuming an exact name.

## Vault touchpoints

- Run `/vault-search` for the component/page name and for prior Figma token mappings before starting, so you reuse decisions already made.
- After the implementation lands, the calling agent records the node -> component mapping and any NEW token mapping through `/vault-write`. If this skill discovers a token mapping not in the table below, say so explicitly in the report so it gets persisted.

## Discovery cache (read once per node)

Every node is pulled through the MCP **once** and reused by every agent and round of the ticket:
`.figma-cache/<fileKey>/<nodeId-with-dashes>/` (git-ignored) holds `discovery.md` (the report from step 8),
`design-context.md` (raw `get_design_context` output), `variables.json` (`get_variable_defs`),
`screenshot.png` and `meta.json` (`{ url, nodeId, name, fetchedAt }`).

- **Before step 2**, check the folder. If `discovery.md` exists and the user has not said the design changed,
  read it and skip the MCP calls entirely. Pull only the child nodes the cache does not cover.
- **After step 8**, write the folder. Give the orchestrator / QA the folder path in the hand-off instead of
  pasting the raw MCP output.
- Refresh (delete and re-run) only when the user says the Figma changed or the cached node id is not the
  one requested.

## Procedure

1. **Parse the reference.** From `figma.com/design/:fileKey/:fileName?node-id=:nodeId`, extract `fileKey` and `nodeId`, converting `-` to `:` in the node id (`39-21141` -> `39:21141`). If only a node id was given with no file link, ask for the URL - never reuse a `fileKey` from a previous, unrelated task.
2. **Confirm the target.** Call `get_metadata` and/or `get_screenshot` for the node first, to check it is the right frame/component before pulling the full context (cheaper, catches a wrong node id early).
3. **Pull the real spec.** Call `get_design_context` for the node. Treat its output as a REFERENCE to adapt, not as final code - it knows nothing about this codebase's components, composables or token conventions.
4. **Resolve ambiguous raw values.** If a color/spacing value is not obviously a token, call `get_variable_defs` to resolve it to a named Figma variable, then map it with the table below.
   The hex values inside `get_design_context` code (`var(--text/color,#262626)`) are variable **fallbacks**, not the mode applied to the frame. Expected colors come from `get_variable_defs`. The CarStore Home frame resolves to the gray surface mode (`#1f2937` text), although its fallbacks are neutral (`#262626`).
5. **Check for an existing match first.** Search `ClientApp/src/components/common/` for an analogous piece (a Dialog shell, a button style, a paginator, a form field, a table). If the app already has a pattern for this UI, prefer reusing/extending the existing convention over the raw Figma pixel value. Introduce a new value only where there is a deliberate visual difference.
6. **Identify assets.** Note any image/icon that must be exported. Icons: prefer an equivalent Lucide icon (`@lucide/vue`, search https://lucide.dev/icons). Real images: export and place under `Src/CarStore.Web/wwwroot/images/<page>/`, referenced by absolute URL (`/images/home/books.jpg`) - not imported through Vite.
7. **Map interaction and data.** Say which parts are static design and which are data-bound (rows, empty state, loading, error, pagination) - the data always comes from the `/api/*` endpoints via the composables, never from Figma sample content.
8. **Report the discovery** (hand-off to `/primevue-component-build`): node id + name, mapped color tokens, spacing/sizing (flagging which need Tailwind arbitrary values vs. the default scale), typography, icons/assets, which existing component(s) to mirror or extend, and which PrimeVue component + `pt` sections will carry the styling.

## Token mapping table (extend as new values appear - never leave a raw hex/px in code when a row below applies)

| Figma value observed | Use this Tailwind/PrimeVue token |
|---|---|
| `#334155` (dark slate) | `surface-700` (`bg-surface-700`, `border-surface-700`, `text-surface-700`) |
| `#1e293b` (darker slate, hover) | `surface-800` |
| `#cbd5e1` / light gray borders | `border-surface-300` |
| `#f8fafc` / very light row hover | `surface-50` / `surface-100` |
| `#ffffff` panel background | `bg-surface-0` |
| `#64748b` muted gray text | `text-muted-color` |
| primary body text (near-black slate) | `text-color` |
| Brand/primary action fill | `bg-primary` + `text-primary-contrast` (or `primaryButtonClass` from `styles/buttonStyles.ts`) |
| Icon glyphs | Lucide components from `@lucide/vue` - never inline SVG, PrimeIcons (`pi pi-*`) or Bootstrap Icons (`bi-*`) when an equivalent Lucide icon exists |

Recurring component-level mappings already derived from Figma (reuse, do not re-derive):

- Modal shell (rounded 21px white panel, 67px header, 3-gap footer) -> `dialogShellPt(width)` / `detailsDialogPt(width)` in `components/common/dialog/dialogStyles.ts`.
- Primary/secondary/danger action buttons -> `primaryButtonClass` / `secondaryButtonClass` / `dangerButtonClass` in `styles/buttonStyles.ts`.
- Row-action popup menu and the flat borderless paginator -> the `menuPt` / `paginatorPt` objects in `components/common/table/DataTableCommon.vue`.

## Rules

- Never fabricate Figma content - always call the MCP tools; if a call fails, say so rather than guessing values.
- Never hardcode a raw hex when a `surface-*`/`*-color` token is an exact or near match.
- Arbitrary Tailwind values (`rounded-[21px]`, `gap-1.75`, `w-[765px]`) are acceptable and already used throughout this codebase when the Figma value does not land on Tailwind's default scale - do not force a bad approximation to avoid one.
- Never copy Figma's generated code verbatim into a component - it ignores the existing composables, `pt` conventions and token utilities.
- Delete any temporary screenshot/reference asset after the implementation is verified against it.
- Always re-derive `fileKey`/`nodeId` from what the user provided in THIS task.
- In a new project, replace the token table above with that project's design-system mapping before using this skill in anger, and record it in that project's vault.
