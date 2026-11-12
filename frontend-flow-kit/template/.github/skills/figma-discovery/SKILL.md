---
name: figma-discovery
description: "Discovers and extracts design specs from Figma for the {{PROJECT_NAME}} Vue/PrimeVue front-end. Use when: the user gives a Figma URL or node reference, asks to implement/match a design, refactor existing UI to align with the design system, or a new/changed component needs accurate spacing, color, typography or assets from Figma before coding. Parses Figma URLs, calls the Figma MCP tools, caches the result in .figma-cache/, and maps raw values to the project's existing PrimeVue/Tailwind tokens instead of raw hex/pixel values."
argument-hint: "A Figma URL or node reference, and what component/page it's for"
---

# Figma Discovery

Extracts an implementable spec from a Figma design BEFORE any component code is written or changed. Never
guess colors, spacing or structure from a screenshot alone: pull the real node data through the Figma MCP
server, then translate it into the project's PrimeVue + Tailwind conventions.

The output is a **discovery report**, not code. Hand it to `figma-refactor` (UI that already exists) or
`primevue-component-build` (new UI).

## Required setup

- `.mcp.json` (Claude Code) and `.vscode/mcp.json` (Copilot) both declare `figma-mcp`
  (`{ "type": "http", "url": "https://mcp.figma.com/mcp" }`). If it is missing or malformed, stop: that is
  `frontend-tooling-specialist` scope.
- The remote server needs the user signed into Figma and the OAuth prompt approved. On an auth/permission error,
  ask the user to re-authenticate; never fall back to invented values.
- Tools: `get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs` (prefixed per host, e.g.
  `mcp__figma-mcp__*` in Claude Code). If the server's instructions ask for `create_session` first, call it.

## Inputs read first

- `.github/instructions/frontend.instructions.md`, sections **Figma → code token mapping**, **Shared building
  blocks** and **Styling rules**. This skill never holds project-specific values.
- Vault: run `vault-search` for the component/page and prior Figma mappings, unless the orchestrator already
  passed note paths.

## Discovery cache (read once per node)

Every node is pulled through the MCP **once** and reused by every agent and every round of a ticket:
`.figma-cache/<fileKey>/<nodeId-with-dashes>/` (git-ignored) holds:

| File | Content |
|---|---|
| `discovery.md` | The report from step 8 |
| `design-context.md` | Raw `get_design_context` output |
| `variables.json` | `get_variable_defs` output |
| `screenshot.png` | `get_screenshot` |
| `meta.json` | `{ url, nodeId, name, fetchedAt }` |

- Before step 2, check the folder. If `discovery.md` exists and the user has not said the design changed, read it
  and skip the MCP calls. Pull only child nodes the cache lacks.
- After step 8, write the folder and hand its path to the orchestrator / QA instead of pasting raw MCP output.
- Refresh (delete and re-run) only when the user says the Figma changed or the cached node is not the one asked.

## Procedure

1. **Parse the reference.** `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → `fileKey`, `nodeId` with
   `-` converted to `:` (`39-21141` → `39:21141`). Branch URLs use the branch key. A bare node id without a file
   link: ask for the URL; never reuse a `fileKey` from an unrelated task.
2. **Confirm the target.** `get_metadata` and/or `get_screenshot` first, to check it is the right frame before
   pulling the full context (cheaper; catches a wrong node early). Avoid `get_metadata` on huge nodes.
3. **Pull the real spec.** `get_design_context` for the node. Its code is a REFERENCE to adapt, never final code.
4. **Resolve values.** `get_variable_defs` resolves colors/spacing to named Figma variables. The hex values inside
   `get_design_context` code (`var(--text/color,#262626)`) are fallbacks, not the mode applied to the frame.
5. **Map to tokens** with the mapping table in `frontend.instructions.md`. If a value has no row, propose one and
   flag it as **new mapping** in the report (it must be added to the table and recorded via `vault-write`).
6. **Check for an existing match.** Search `src/components/common/` and the shared building blocks for an
   analogous piece (dialog shell, button style, paginator, form field, table). Prefer reusing/extending it.
   Introduce a new value only for a deliberate visual difference.
7. **Assets and data.** Icons → an equivalent Lucide icon (https://lucide.dev/icons). Real images → exported to
   the images folder named in `frontend.instructions.md`. Say which parts are static and which are data-bound
   (rows, empty, loading, error, pagination): data comes from the API through the composables, never from Figma
   sample content.
8. **Report** (hand-off):
   - node id, name, URL and cache folder
   - mapped color tokens, spacing/sizing (default scale vs. arbitrary values), typography
   - icons and assets
   - existing components to reuse/extend, PrimeVue components and `pt` sections that carry the styling
   - data-bound parts and states
   - **new mappings** and **open questions** (anything ambiguous goes to the user, not into code)

## Rules

- Never fabricate Figma content; if a call fails, say so.
- Never hardcode a raw hex when a token is an exact or near match.
- Arbitrary Tailwind values are acceptable when Figma is off-scale.
- Never copy Figma's generated code verbatim.
- Follow the design exactly. A deviation is an open question for the user, never a silent decision.
- Always re-derive `fileKey`/`nodeId` from what the user provided in THIS task.
