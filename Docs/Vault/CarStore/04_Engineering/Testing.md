---
type: guide
created: 2026-07-22
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/tests
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

- `Src/CarStore.Tests/AuthorTests.cs`
- `Src/CarStore.Tests/BookTests.cs`
- `Src/CarStore.Tests/CustomerTests.cs`

## What is covered

- `Brand.Create` happy path and validation (empty name, future birth date).
- `Brand.Age` computed property.
- `Brand.EnsureCanBeDeleted` when the brand has cars.
- `Car.Create` and `Car.Update` with valid `Mileage`.
- `Car.Create` validation for `Mileage` <= 0.
- `Customer.Create` happy path and `Update` applying changes.
- `Customer.Create` validation: empty/whitespace full name, full name > 150 characters, empty/whitespace email, invalid email format.

## Run tests

```bash
dotnet test Src/CarStore.Tests/CarStore.Tests.csproj
```

## Related

- [[Visual-QA-Harness]]
- [[Engineering-Overview]]
- [[Brand]]
- [[Car]]
- [[Operations-Overview]]
