---
type: overview
created: 2026-07-22
updated: 2026-11-11
tags:
  - note
  - type/overview
  - area/domain
  - entity/brand
  - entity/car
  - entity/customer
---

# Domain Overview

Domain layer for CarStore: entities, relationships, invariants, errors, and seed data.

## Context

All business rules are owned by `CarStore.Domain`. Services and controllers may only call domain methods; they do not mutate entity state directly.

## Entities

- [[Brand]] — brand aggregate with name, description, country, founded date, years in business, and car collection.
- [[Car]] — car aggregate with model, VIN, body type, price, stock, availability, mileage, and brand reference.
- [[Customer]] — customer with full name, email, phone, creation date and an optional car link (`CarId`).

## Relationship

- One brand has many cars (`Brand.Cars`).
- Each car belongs to one brand (`Car.BrandId` → `Brand`).
- EF Core mapping uses `OnDelete(DeleteBehavior.Restrict)` in `CarStoreContext.OnModelCreating`.
- Domain-level guard: `Brand.EnsureCanBeDeleted()` throws `DomainException` when the brand still has cars.
- A customer optionally links to one car (`Customer.CarId` → `Car`, `SetNull` on car delete, no inverse collection); see [[Customer]].

## Error model

- All invariant violations throw `DomainException` (`Src/CarStore.Domain/Exceptions/DomainException.cs`).
- `DomainException` is a plain `Exception` subclass with a message constructor.
- Domain entities never throw `InvalidOperationException`.

## Seed data

- `DataSeeder.Seed(db)` (`Src/CarStore.Domain/Seed/DataSeeder.cs`) is a no-op if any brand or car already exists.
- Seeds 10 brands and 27 cars across body types, some with `Stock = 0` to exercise the `IsAvailable` invariant.
- Persistence is EF Core In-Memory; data resets on every process restart.

## Source files

- `Src/CarStore.Domain/Entities/Brand.cs`
- `Src/CarStore.Domain/Entities/Car.cs`
- `Src/CarStore.Domain/Data/CarStoreContext.cs`
- `Src/CarStore.Domain/Seed/DataSeeder.cs`
- `Src/CarStore.Domain/Exceptions/DomainException.cs`

## Related

- [[Brand]]
- [[Car]]
- [[Architecture-Overview]]
- [[Operations-Overview]]
