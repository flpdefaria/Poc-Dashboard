---
type: overview
created: 2026-07-22
updated: 2026-11-12
tags:
  - note
  - type/overview
  - area/project
  - component/domain
  - component/application
  - component/web
  - component/tests
---

# Repository Structure

Top-level layout of the CarStore .NET 10 MVC solution and how the four projects relate.

## Context

The codebase lives under `Src/` and is built as a single .NET 10 solution. The repository also contains training modules, deployment scripts, and this Obsidian vault.

## Root files and folders

| Path | Purpose |
|------|---------|
| `Src/CarStore.slnx` | Solution file referencing all projects. |
| `Src/CarStore.Domain/` | Domain layer: entities, `DbContext`, seed data, domain exception. |
| `Src/CarStore.Application/` | Application layer: services and `PagedResult<T>`. |
| `Src/CarStore.Web/` | ASP.NET Core 10 MVC web application (composition root). |
| `Src/CarStore.Tests/` | xUnit tests for the domain layer. |
| `deploy.sh` | Manual Azure App Service deployment script. |
| `README.md` | Webinar series overview and quick-start. |
| `full-doc.md` | Working source-of-truth document used to reconcile this vault. |
| `Docs/Vault/CarStore/` | This living-documentation vault. |
| `Modules/` | Per-module training content for the webinar series. |

## Project dependency graph

```
CarStore.Web
├── CarStore.Application
│   └── CarStore.Domain
└── CarStore.Domain

CarStore.Tests
└── CarStore.Domain
```

## Key files for new contributors

- Composition root: `Src/CarStore.Web/Program.cs`
- Domain context: `Src/CarStore.Domain/Data/CarStoreContext.cs`
- Seed data: `Src/CarStore.Domain/Seed/DataSeeder.cs`
- Domain exception: `Src/CarStore.Domain/Exceptions/DomainException.cs`

## AI agent tooling (Claude Code × Copilot)

Both hosts share one copy of the skills (`.claude/skills/*` → `.github/skills/*` symlinks), the instructions
(`.github/instructions/`, imported by `CLAUDE.md`) and the MCP servers (`.mcp.json` = `.vscode/mcp.json`).
Mirrored by hand, changed together:

| Concern | Copilot | Claude Code |
|---|---|---|
| Frontend implementation | `.github/agents/frontend-agent.agent.md` | `.claude/agents/frontend-agent.md` |
| Visual QA | `.github/agents/qa-agent.agent.md` | `.claude/agents/qa-agent.md` |
| Impeccable design hook | `.github/hooks/impeccable.json` | `.claude/settings.json` (`PostToolUse` Edit/Write + `Stop`) |
| Task planner | `.github/prompts/task-planner.prompt.md` | `.claude/commands/task-planner.md` (symlink, host-neutral routing table) |

Copilot-only: Frontend-Tooling-Specialist, Developer-Specialist, Tester-Specialist and the `impeccable-*`
agents; Claude runs that work in the main thread following those files. See [[Visual-QA-Harness]].

## Related

- [[Dependencies]]
- [[Architecture-Overview]]
- [[Operations-Overview]]
