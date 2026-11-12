# CarStore

@.github/copilot-instructions.md

## Claude Code specifics

The instructions above are shared with GitHub Copilot. Copilot loads the path-specific files in
`.github/instructions/` automatically; Claude Code does not, so **read the matching file before editing**:

| Editing | Read first |
|---|---|
| `Src/CarStore.Web/ClientApp/**` | `.github/instructions/frontend.instructions.md` |
| `Src/CarStore.Web/` controllers, DTOs, views, `Program.cs` | `.github/instructions/web.instructions.md` |
| Paged lists (services, API, `usePagedFetch`, `DataTableCommon`) | `.github/instructions/pagination.instructions.md` |
| `Docs/Vault/CarStore/**` | `.github/instructions/vault.instructions.md` |

- Agents: `.claude/agents/` (`frontend-agent`, `qa-agent`). The Copilot agents in `.github/agents/` (Developer, Tester, Tooling) are useful references for backend, test and tooling tasks. The four `impeccable-*` agents exist for Copilot only. In Claude Code the `impeccable` skill falls back to its in-thread `reference/degraded/*.md` procedures.
- Skills: `.claude/skills/` entries are symlinks into `.github/skills/`. Edit the files under `.github/skills/`, never replace a symlink with a copy.
- MCP: `.mcp.json` here mirrors `.vscode/mcp.json` for Copilot. Change both together.
- Commands: `.claude/commands/task-planner.md` is a symlink to `.github/prompts/task-planner.prompt.md` (shared, host-neutral). Edit the `.github/prompts/` file.
- Hooks: `.claude/settings.json` runs the Impeccable design detector (`PostToolUse` on `Edit|Write`, deep pass on `Stop`), mirroring `.github/hooks/impeccable.json` for Copilot. Change both together; toggle per project with `impeccable hooks on|off`.
- Agent pairs: `frontend-agent` and `qa-agent` share the same name in both hosts (`.claude/agents/<name>.md` ↔ `.github/agents/<name>.agent.md`) and are kept equivalent by hand. When you change one, apply the same rule to the other (host-specific bits only differ: Claude `model`, Copilot `tools`).
