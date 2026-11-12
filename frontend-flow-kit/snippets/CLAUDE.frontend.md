## Claude Code specifics (front-end flow)

The shared instructions live in `.github/copilot-instructions.md` (import it with `@.github/copilot-instructions.md`
at the top of this file). Copilot loads `.github/instructions/` automatically; Claude Code does not, so **read the
matching file before editing**:

| Editing | Read first |
|---|---|
| `{{CLIENT_APP_DIR}}/**` | `.github/instructions/frontend.instructions.md` |
| `{{VAULT_DIR}}/**` | `.github/instructions/vault.instructions.md` |

- Agents: `.claude/agents/` (`frontend-agent`, `qa-agent`). Frontend tooling runs in the main thread following
  `.github/agents/frontend-tooling-specialist.agent.md`.
- Skills: `.claude/skills/` entries are symlinks into `.github/skills/`. Edit the files under `.github/skills/`;
  never replace a symlink with a copy.
- MCP: `.mcp.json` mirrors `.vscode/mcp.json`. Change both together.
- Commands: `.claude/commands/task-planner.md` is a symlink to `.github/prompts/task-planner.prompt.md`.
- Agent pairs: `frontend-agent` and `qa-agent` exist in both hosts and are kept equivalent by hand. When you change
  one, apply the same rule to the other (only `model` / `tools` differ).
