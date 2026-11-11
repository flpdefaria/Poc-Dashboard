# CarStore - repository instructions

Shared by GitHub Copilot (loaded automatically) and Claude Code (imported by `CLAUDE.md`).

## Solution layout
- .NET 10 multi-project solution under `Src/`.
  - `CarStore.Domain` - entities (`Brand`, `Car`, `Customer`), `CarStoreContext` (EF Core In-Memory), seed data.
  - `CarStore.Application` - application services (orchestration only).
  - `CarStore.Web` - ASP.NET Core 10 host: one SPA shell view + JSON API controllers (`Controllers/Api/`). The UI is a Vue 3 + PrimeVue + Tailwind CSS v4 single-page app built from `ClientApp/`. Bootstrap and jQuery have been removed.
  - `CarStore.Tests` - xUnit + FluentAssertions domain tests.
- No authentication.

## Path-specific instructions
| Path | Read |
|---|---|
| `Src/CarStore.Web/ClientApp/**` | `.github/instructions/frontend.instructions.md` |
| `Src/CarStore.Web/` (controllers, DTOs, views, `Program.cs`) | `.github/instructions/web.instructions.md` |
| Paged lists (services, API, tables) | `.github/instructions/pagination.instructions.md` |
| `Docs/Vault/CarStore/**` | `.github/instructions/vault.instructions.md` |

`npm run build` in `Src/CarStore.Web/ClientApp` is required after any front-end change; it is not part of `dotnet build`.

## Architecture rules
- **Domain layer** (`CarStore.Domain`) owns all business rules.
  - Entities are **rich**: invariants are enforced through domain methods (`Create`, `Update`, `EnsureCanBeDeleted`), not in services.
  - Invariants include: Car `Model` required, `Price`/`Stock`/`Mileage >= 0`, `ModelYear` not in the future, `IsAvailable = Stock > 0`; Brand name required and `FoundedDate` not in the future, a brand with cars cannot be deleted; Customer full name and a valid email required, and an optional `CarId` must be positive and reference an existing car (checked in `CustomerService`).
  - Throw `DomainException` (`CarStore.Domain/Exceptions/DomainException.cs`) on invariant violations. Never throw `InvalidOperationException` from entities.
- **Application layer** (`CarStore.Application`) only orchestrates: load aggregates via `CarStoreContext`, call domain methods, persist via `SaveChangesAsync`. Do not duplicate business rules.
- **API controllers** are thin: bind the request DTO, call the service, map to a response DTO, and map `DomainException` to `400 { message }`. No business logic.

## Code style
- C# 12, nullable enabled, file-scoped namespaces, `var` when type is obvious.
- `async`/`await` end-to-end for all DB calls.
- Domain methods use verbs (`Create`, `Update`, `EnsureCanBeDeleted`, ...).

## Build & run
- Build: `dotnet build Src/CarStore.slnx` · Test: `dotnet test Src/CarStore.Tests`
- Run: `dotnet run --project Src/CarStore.Web` (http://localhost:5045)
- Persistence: EF Core In-Memory only, re-seeded on every start. Do not add migrations or change the provider.

## Vault workflow (every agent, every code change)
1. Read `.github/instructions/vault.instructions.md`.
2. Run the `vault-search` skill for existing context **before** writing code.
3. Do the work.
4. Run the `vault-write` skill **after**, recording what changed (new tags go into `00_Index/Tags.md` first).

Never hand-edit vault notes; always go through `vault-write`. Read-only tasks (QA, reviews) write to the vault only for reusable findings.

## Agents and skills
| Work | Copilot agent (`.github/agents/`) | Claude agent (`.claude/agents/`) |
|---|---|---|
| Domain/API changes | Developer-Specialist | - |
| Domain unit tests | Tester-Specialist | - |
| Vue components, Figma, charts | Frontend-Specialist | `frontend-agent` |
| Front-end tooling, deps, MCP setup | Frontend-Tooling-Specialist | - |
| Visual QA (Playwright harness in `ClientApp/visual/`, report in `qa-results/`) | QA-Specialist | `qa-agent` |

Skills live in `.github/skills/`; `.claude/skills/` holds symlinks to the same folders. Keep one copy.

MCP servers (`primevue`, `figma-mcp`, `playwright`) are declared twice with the same content: `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code/Copilot). Change both together.

## General guidance
- Read the file before editing it. Do not invent class names.
- Keep changes minimal and focused on the requested task.
