# poc-dashboard

A hands-on GitHub Copilot workshop project built on a real-world **.NET 10 MVC** solution. **poc-dashboard** manages
brands, cars and customers, and doubles as a reference implementation for migrating a classic MVC + Razor +
Bootstrap app into an MVC-hosted **Vue 3 + PrimeVue + Tailwind CSS v4** single-page app.

## Solution layout

```
Src/
  CarStore.slnx
  CarStore.Domain/        # Rich entities (Brand, Car, Customer), CarStoreContext (EF Core In-Memory), seed data
  CarStore.Application/   # Application services - orchestration only, no business rules
  CarStore.Web/           # ASP.NET Core 10 MVC host + JSON /api/* controllers + Vue 3 SPA (ClientApp/)
  CarStore.Tests/         # xUnit tests for the domain layer
```

- **Domain layer** owns every business rule (e.g. price/stock can't be negative, a brand with cars can't be
  deleted) and enforces them through domain methods (`Rename`, `Restock`, `ChangePrice`, ...), throwing
  `DomainException` on violations.
- **Application layer** only loads aggregates, calls domain methods and persists changes - no duplicated rules.
- **CarStore.Web** serves a single SPA shell (`Views/Home/Index.cshtml`) rendered by Vue 3 + PrimeVue +
  Tailwind CSS v4; Vue Router owns in-app navigation (`/`, `/cars`, `/brands`, `/customers`) and every page
  talks to `/api/*` JSON endpoints backed by the application services. Persistence is EF Core **In-Memory**,
  re-seeded on every run - data resets on restart.

See `.github/copilot-instructions.md` and `.github/instructions/` for the full architecture, front-end and
pagination conventions.

## Branches

| Branch | What it is |
|---|---|
| `main` | Latest stable state of the project |
| `Initial` | Starting point used for the Copilot workshop modules |

## Modules

Each `Modules/moduleN/content.md` is a live-session script showing how to use a different set of GitHub
Copilot features (Ask/Plan/Agent modes, custom instructions, agents, MCP servers, ...) to solve concrete
problems in this codebase.

## Quick start

Prerequisites: .NET 10 SDK, Node.js 20+ and npm 10+ (for the front-end).

```bash
git checkout Initial

# front-end bundle (required at least once; re-run after any ClientApp change)
cd Src/CarStore.Web/ClientApp
npm install
npm run build
cd ../../..

# back-end
dotnet build Src/CarStore.slnx
dotnet run --project Src/CarStore.Web
```

Open <http://localhost:5045>.

`dotnet test Src/CarStore.Tests/CarStore.Tests.csproj` runs the domain unit tests.

## Deploy

`./deploy.sh` publishes and zip-deploys the app (Azure App Service). It does not run `npm`, so
`Src/CarStore.Web/wwwroot/dist` must be rebuilt and committed beforehand.
