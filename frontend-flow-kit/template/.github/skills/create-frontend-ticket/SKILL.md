---
name: create-frontend-ticket
description: "Create a frontend-only {{PROJECT_NAME}} ticket that orchestrates independent implementation (frontend-agent) and Playwright QA (qa-agent), with optional Figma input and a bounded correction cycle. Saves ticket-frontend-<slug>.md in the repository root. Use when: planning a UI feature/fix or a Figma screen refactor end-to-end, writing a frontend spec, or setting up the implement → QA → correct loop."
argument-hint: "What the UI change is, optional Figma URL"
---

# Create Frontend Ticket

Write a self-contained `ticket-frontend-<kebab-slug>.md` in the repository root. It is the contract the
orchestrator (you, the main session, or a person) follows. Creating a ticket does not execute it or publish
anything.

## Discover

1. Run `vault-search` for the screens/components involved (skip if the project has no vault). Read
   `.github/instructions/frontend.instructions.md` and the existing components, composables and DTO types.
2. With a Figma URL, run `figma-discovery` (fills `.figma-cache/`). For existing UI, also run `figma-refactor`.
   Without a URL, use the text requirements and skip Figma tools.
3. Use the PrimeVue MCP to verify the selected components and APIs. Existing project components come first, then
   PrimeVue primitives.
4. Identify the real API endpoints and affected files. A missing backend capability is an explicit dependency for a
   separate ticket, never a hidden endpoint/DTO change.

## Ticket contents

- **Title / Description:** outcome, frontend-only scope, `frontend-agent` as implementer.
- **References:** vault notes, exact source files and patterns, Figma URL/node and `.figma-cache/` folder.
- **Requirements:** visible elements, copy (UI language from the instructions), interactions, data sources,
  loading/empty/error states, widths (`mobile-responsive` when below desktop), both themes, accessibility. Each
  expected outcome must be verifiable from the text or from Figma.
- **Tech Details:** conventions from the instructions, mandatory PrimeVue MCP, Lucide only, tokens instead of hex,
  server-side paging, no fixture data in production.
- **Implementation:** context → `figma-discovery` / `figma-refactor` → `primevue-component-build` (or
  `echarts-chart-build`) → `npm run verify` → delivery summary.
- **Development and QA cycle:** the cycle below.
- **Verify:** `npm run verify`, `{{BACKEND_BUILD_CMD}}` if a DTO changed, and the QA evidence cycle.
- **Out of Scope:** backend, API contracts, domain rules, persistence, tooling, unrelated design changes.
- **Observations:** prerequisites, design decisions pending with the user, unavailable checks, defects left.
- **Acceptance Criteria:** checkboxes for the requested behavior, PrimeVue evidence, Figma evidence, QA
  `findings.md`, and the final vault criterion.

## Cycle to include in the ticket

0. The orchestrator runs `vault-search` **once** and passes the relevant note paths to every agent. With a Figma
   URL, the first agent fills `.figma-cache/`; every later agent and round receives that folder path instead of
   calling the Figma MCP again.
1. **Implement:** give the requirements, note paths and Figma URL to `frontend-agent`; keep its delivery summary
   (`arquivos`, `componentes`, `estados`, `larguras`, `figma`, `figma-cache`, `lacunas`, `vault`).
2. **QA:** give the requirements and the summary to `qa-agent`; keep `qa-results/<run>/findings.md` and the run
   path. The first pass is **exhaustive**: every requested scenario, light and dark, strict against Figma.
3. **Correct:** pass only non-minimal `defeito` items back to `frontend-agent` (correction mode), then `qa-agent`
   in **recheck mode** (`npm run visual:recheck -- <run>`) on the **same run folder**. Never send `minimas[]`.
4. At most **three correction rounds**. Stop earlier when no defects remain, when blocked, or when a round does not
   reduce defects. Record what remains in Observations without claiming PASS.
5. After the last round, the orchestrator runs `vault-write` **once**, from the facts the agents reported.
6. Committing (code, rebuilt bundle, `qa-results/<run>/` judgement files) only as part of an authorized delivery.

**Model per stage (Claude Code):** first implementation and exhaustive QA use the agents' default model.
Correction rounds and rechecks are narrow: launch them with `model: "sonnet"`. Start each ticket in a fresh session
(`/clear`); the ticket, delivery summaries and `findings.md` carry the state.

Neither agent invokes the other; the orchestrator passes artifacts between stages. If the host cannot launch
subagents, run each agent's instructions sequentially in the current session, preserving scope and artifacts.

## Final acceptance criterion

- [ ] **Vault**: after implementation, the vault reflects the components, Figma nodes, token mappings and shared
      helpers that changed.

Before returning the saved path, verify scope, real file references, Figma handling, PrimeVue verification, the
bounded cycle and the vault criterion.
