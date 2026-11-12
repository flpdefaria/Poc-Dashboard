## Front-end flow (Vue 3 + PrimeVue + Tailwind v4 + Lucide)

`{{CLIENT_APP_DIR}}` holds the SPA. `npm run verify` there (vue-tsc + check:conventions + build) is required after any
front-end change; it is not part of the backend build.

### Path-specific instructions
| Path | Read |
|---|---|
| `{{CLIENT_APP_DIR}}/**` | `.github/instructions/frontend.instructions.md` |
| `{{VAULT_DIR}}/**` | `.github/instructions/vault.instructions.md` |

### Agents and skills
| Work | Copilot agent (`.github/agents/`) | Claude agent (`.claude/agents/`) |
|---|---|---|
| Vue components, Figma screens/refactors, charts | `frontend-agent` | `frontend-agent` |
| Visual QA (Playwright harness in `{{CLIENT_APP_DIR}}/visual/`, report in `qa-results/`) | `qa-agent` | `qa-agent` |
| Front-end tooling, deps, MCP setup | Frontend-Tooling-Specialist | main thread, following the Copilot file |

Skills live in `.github/skills/`; `.claude/skills/` holds symlinks to the same folders. Keep one copy.
Figma flow: `figma-discovery` → `figma-refactor` (existing UI) → `primevue-component-build` → `npm run verify` →
`qa-agent` (`frontend-visual-check`). End-to-end tickets: `create-frontend-ticket` (implement → QA → max 3
correction rounds).

MCP servers (`primevue`, `figma-mcp`, `playwright`) are declared twice with the same content: `.mcp.json` (Claude
Code) and `.vscode/mcp.json` (VS Code/Copilot). Change both together. Also mirrored by hand: the agent pairs
`frontend-agent` and `qa-agent` (`.github/agents/<name>.agent.md` ↔ `.claude/agents/<name>.md`) and the
`task-planner` prompt (`.github/prompts/` ↔ symlink in `.claude/commands/`).

### Vault workflow (every agent, every code change)
1. Read `.github/instructions/vault.instructions.md`.
2. Run `vault-search` for existing context **before** writing code.
3. Do the work.
4. Run `vault-write` **after**, recording what changed (new tags go into `00_Index/Tags.md` first).

**Orchestrated tickets (implement → QA → correct):** the orchestrator runs `vault-search` once and passes the note
paths to each agent, and runs `vault-write` once after the final round. Correction rounds and QA rechecks skip both.
