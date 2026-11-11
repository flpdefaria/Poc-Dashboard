---
type: overview
created: 2026-07-22
updated: 2026-11-11
tags:
  - note
  - type/overview
  - area/operations
---

# Operations Overview

Build, run, test, and persistence information for the CarStore solution.

## Context

The solution is a plain .NET 10 web application with no CI/CD pipeline. Local development and manual Azure deployment are the current workflows.

## Build

```bash
dotnet build Src/CarStore.slnx
```

## Run locally

```bash
dotnet run --project Src/CarStore.Web
```

Then open <http://localhost:5045> (from `Src/CarStore.Web/Properties/launchSettings.json`).

## Test

```bash
dotnet test Src/CarStore.Tests/CarStore.Tests.csproj
```

## Persistence

- EF Core In-Memory provider.
- Database name: `CarStoreDb` (configured in `Src/CarStore.Web/Program.cs`).
- Data is re-seeded on every process restart via `DataSeeder.Seed(db)`.
- No migrations and no other database provider is configured.

## Configuration

`Src/CarStore.Web/appsettings.json` contains only default ASP.NET Core logging and `AllowedHosts: "*"`. There are no connection strings, secrets, or feature flags today.

## Deployment

Production deployment is manual via `deploy.sh`. See [[Deployment-Runbook]] for the exact steps and Azure targets.

## Source

- `Src/CarStore.Web/Program.cs`
- `Src/CarStore.Web/Properties/launchSettings.json`
- `Src/CarStore.Web/appsettings.json`
- `Src/CarStore.Domain/Data/CarStoreContext.cs`
- `Src/CarStore.Domain/Seed/DataSeeder.cs`
- `README.md`

## Related

- [[Visual-QA-Harness]]
- [[Deployment-Runbook]]
- [[Testing]]
- [[Architecture-Overview]]
- [[Azure-App-Service-Docs]]
