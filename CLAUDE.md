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

- Agents: `.claude/agents/` (`frontend-agent`, `qa-agent`). The Copilot agents in `.github/agents/` (Developer, Tester, Tooling) are useful references for backend, test and tooling tasks.
- Skills: `.claude/skills/` entries are symlinks into `.github/skills/`. Edit the files under `.github/skills/`, never replace a symlink with a copy.
- MCP: `.mcp.json` here mirrors `.vscode/mcp.json` for Copilot. Change both together.
