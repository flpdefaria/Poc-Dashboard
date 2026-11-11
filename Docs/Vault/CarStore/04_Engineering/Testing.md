---
type: guide
created: 2026-07-22
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/tests
  - entity/brand
  - entity/car
  - entity/customer
---

# Testing

xUnit test strategy for the CarStore domain layer.

## Context

`CarStore.Tests` exercises the domain entities (`Brand`, `Car`, `Customer`) directly. There are no integration or controller tests yet.

## Stack

| Package | Version |
|---------|---------|
| `xunit` | `2.9.3` |
| `FluentAssertions` | `8.10.0` |
| `Microsoft.NET.Test.Sdk` | `17.14.1` |
| `coverlet.collector` | `6.0.4` |
| `xunit.runner.visualstudio` | `3.1.4` |

## Test files

- `Src/CarStore.Tests/BrandTests.cs`
- `Src/CarStore.Tests/CarTests.cs`
- `Src/CarStore.Tests/CustomerTests.cs`

## What is covered

- **Brand:**
  - `Create`: happy path, empty/whitespace name, future `FoundedDate`
  - `YearsInBusiness`, exactly 30 years
  - `EnsureCanBeDeleted` throws when the brand has cars
- **Car:**
  - `Create` / `Update` with valid mileage
  - mileage 0 is allowed; negative mileage throws
  - model year too far in the future throws
- **Customer:**
  - `Create`: happy path, empty/whitespace full name, full name over 150 characters, empty/whitespace email,
    invalid email format
  - `Update` applies the changes
- **Customer car link** (2026-11-11, see [[Customer]]):
  - no car (`CarId` null)
  - valid car id
  - non-positive id throws `"Customer car id is invalid."` on `Create` and `Update`
  - changing the car
  - clearing it with `null`

Whether the car exists (`"Car does not exist."`) is checked in `CustomerService`. No service or API tests exist
yet, so that rule is verified only through the API (see [[Visual-QA-Harness]] for the frontend QA harness).

## Run tests

```bash
dotnet test Src/CarStore.Tests/CarStore.Tests.csproj
```

## Related

- [[Visual-QA-Harness]]
- [[Engineering-Overview]]
- [[Brand]]
- [[Car]]
- [[Customer]]
- [[Operations-Overview]]
