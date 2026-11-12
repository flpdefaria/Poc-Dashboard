---
name: create-frontend-ticket
description: "Create a frontend-only CarStore ticket that orchestrates independent implementation (frontend agent) and Playwright QA (qa agent), with optional Figma input and a bounded correction cycle. Saves ticket-frontend-<slug>.md in the repository root. Use when: planning a UI feature/fix end-to-end, writing a frontend spec, or setting up the implement → QA → correct loop."
argument-hint: "What the UI change is, optional Figma URL"
---

# Create Frontend Ticket

Write a self-contained `ticket-frontend-<kebab-slug>.md` in the repository root. This is one possible orchestrator contract; a plan, another agent or a person can run the same cycle. Creating a ticket does not execute it or publish anything.

## Discover

1. Run `vault-search` for the screens/components involved. Read `.github/instructions/frontend.instructions.md`, the "JSON API controllers" section of `web.instructions.md`, and the existing components, composables and `types.ts`.
2. With a Figma URL, run `figma-discovery`. For existing UI, also run `figma-refactor`. Without a URL, use the text requirements and skip Figma tools.
3. Use the PrimeVue MCP to verify the selected components and APIs. Existing CarStore components come first, then PrimeVue primitives.
4. Identify the real `/api/*` endpoints and affected files. A missing backend capability is an explicit dependency for a separate ticket (Developer-Specialist), never a hidden endpoint/DTO change.

## Ticket contents

- **Title / Description:** outcome, frontend-only scope, with `frontend-agent` as implementer (same name in Claude and Copilot).
- **References:** vault notes, exact source files and patterns, Figma URL/node when supplied.
- **Requirements:** visible elements, copy (pt-BR UI), interactions, data sources, loading/empty/error states, widths (`carstore-mobile-responsive` when below desktop), both themes, accessibility. Each expected outcome must be verifiable from the text or from Figma.
- **Tech Details:** ClientApp conventions, mandatory PrimeVue MCP, Lucide only, tokens instead of hex, no Bootstrap, server-side paging, no fixture data in production.
- **Implementation:** context → optional `figma-discovery` (cached in `.figma-cache/`) / `figma-refactor` → `primevue-component-build` (or `echarts-chart-build`) → `npm run verify` → delivery summary with `arquivos`, `componentes`, `estados`, `larguras`, optional `figma`, `figma-cache`, `lacunas`, `vault` (facts for the final `vault-write`).
- **Ciclo de desenvolvimento e QA:** the full cycle below.
- **Verify:** `npm run verify`, `dotnet build Src/CarStore.slnx` if a DTO changed, and the QA evidence cycle.
- **Out of Scope:** backend, API contracts, domain rules, persistence, tooling (`vite.config.ts`, `package.json`, `.mcp.json`), and unrelated design changes.
- **Observations:** prerequisites, backend/design decisions, unavailable checks, defects left after the cycle.
- **Acceptance Criteria:** checkboxes for the requested behavior, PrimeVue evidence, optional Figma evidence, QA `findings.md`, and the final vault criterion.

## Cycle to include in the ticket

0. The orchestrator runs `vault-search` **once** and passes the relevant note paths to every agent. With a Figma URL, the first agent fills `.figma-cache/` (`figma-discovery`); every later agent and round receives that folder path instead of calling the Figma MCP again.
1. Give the requirements, vault note paths and optional Figma URL to the frontend agent, and keep its delivery summary.
2. Give the requirements and summary to `qa-agent`, and keep `qa-results/<run>/findings.md` and the run path. This first QA pass is **exhaustive**: every requested scenario, light and dark, strict against Figma, so all defects surface in one round instead of one per round. QA can also run alone for an existing change, given requirements and a changed-file list.
3. Pass only non-minimal `defeito` items back to the frontend agent (correction mode), then send QA in **recheck mode** (`npm run visual:recheck -- <run>`) with the **same run folder**. Never send `minimas[]` for correction. Rechecks and corrections skip the vault, the Figma MCP and the instruction re-reads.
4. Allow at most **three correction rounds**. Stop earlier when no defects remain, when blocked, or when a round does not reduce defects. Record remaining items in Observations without claiming PASS.
5. After the last round, the orchestrator runs `vault-write` **once**, from the facts the agents reported.
6. As part of an authorized delivery, commit the code, the rebuilt `wwwroot/dist/` and `qa-results/<run>/` (git keeps only the judgement files; screenshots stay local, see `frontend-visual-check`). Creating the ticket does not authorize committing.

**Model per stage (Claude Code):** the first implementation and the exhaustive QA pass use the agents' default model. Correction rounds and rechecks are narrow and scripted: launch them with `model: "sonnet"` on the Agent call. Start each ticket in a fresh session (`/clear`); the ticket file, delivery summaries and `findings.md` carry the state, not the chat history.

Neither agent invokes the other. The orchestrator passes artifacts between stages. If the host cannot launch subagents, run each agent's instructions sequentially in the current session, preserving scope and artifacts.

## Final acceptance criterion

- [ ] **Vault**: After implementation, update the vault to sync the codebase, business logic, architecture documentation and any other relevant vault sections.

Before returning the saved path, verify scope, real file references, Figma handling, PrimeVue verification, the bounded cycle and the final Vault criterion.
