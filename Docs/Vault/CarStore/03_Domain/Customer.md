---
type: reference
created: 2026-11-11
updated: 2026-11-12
tags:
  - note
  - type/reference
  - area/domain
  - entity/customer
  - entity/car
---

# Customer

The `Customer` domain entity: properties, the optional link to a [[Car]], factory/update methods, and invariants.

## Source

- Entity: `Src/CarStore.Domain/Entities/Customer.cs`
- Service: `Src/CarStore.Application/Services/CustomerService.cs`
- API: `Src/CarStore.Web/Controllers/Api/CustomersApiController.cs`, DTOs `CustomerDto` / `CreateCustomerRequest`

## Properties

| Property | Type | Notes |
|----------|------|-------|
| `Id` | `int` | Database-generated identity. |
| `FullName` | `string` | Required, max 150 characters, trimmed. |
| `Email` | `string` | Required, valid format, max 256, trimmed. |
| `PhoneNumber` | `string?` | Max 50, trimmed. |
| `CreatedAt` | `DateTime` | `DateTime.UtcNow` on `Create`. |
| `CarId` | `int?` | Optional link to a car (added 2026-11-11). |
| `Car` | `Car?` | Navigation; no inverse collection on `Car`. |

## Factory and mutators

- `Customer.Create(fullName, email, phoneNumber, carId = null)`
- `Update(fullName, email, phoneNumber, carId = null)`: `PUT` replaces every field, so `null` clears the car.

## Invariants (exact `DomainException` messages)

| Condition | Where | Message |
|-----------|-------|---------|
| `FullName` empty/whitespace | entity | `"Customer full name is required."` |
| `FullName` > 150 characters | entity | `"Customer full name must be at most 150 characters."` |
| `Email` empty/whitespace | entity | `"Customer email is required."` |
| `Email` invalid format | entity | `"Customer email is invalid."` |
| `CarId` <= 0 | entity | `"Customer car id is invalid."` |
| `CarId` not found | `CustomerService` (same pattern as `CarService` "Brand does not exist.") | `"Car does not exist."` |

## EF Core mapping and deletion

`CarStoreContext`:

```csharp
entity.HasOne(c => c.Car).WithMany().HasForeignKey(c => c.CarId)
    .IsRequired(false).OnDelete(DeleteBehavior.SetNull);
```

The in-memory provider has no database FK, so `SetNull` only applies to **tracked** customers.
`CarService.DeleteAsync` therefore loads the customers linked to the car before removing it. Without that
step, a deleted car left a dangling `CarId` (found by API test on 2026-11-11).

## API

- `CustomerDto` gains `CarId` and `CarName`. `CarName` is `"{Brand.Name} {Model}"`, e.g. "Toyota Corolla",
  or `null`.
- `CustomerService` reads include `Car` and `Car.Brand`.
- `CreateCustomerRequest` gains an optional `CarId`. Invalid values return `400 { message }`.

## UI

- `CustomersPage.vue` loads `GET /api/cars/options` (`CarOptionDto` `{ id, name }`, name = "Brand Model",
  sorted by name, served by `CarsApiController.Options` over `ICarService.GetAllAsync`). It passes the list
  to `CreateCustomerDialog` and, through `CustomersTable`, to `EditCustomerDialog`.
- Both dialogs have a "Carro" field: a PrimeVue `Select` with filter and `show-clear`, placeholder
  "Sem carro". The edit dialog preselects the customer's `carId`, and clearing it sends `carId: null`
  (unlink).
- QA: `visual/scenarios/customer-dialogs.ts` (create with filter, edit with car, light/dark). The run
  `qa-results/2026-11-11T13-40-40-382Z-customers-page` is PASS.
- Screen layout and dialogs follow the Figma "Clientes" canvas: see [[Customers-Page]].

## Seed

`DataSeeder.SeedCustomers` links 13 of the 15 customers to a car. Henry Wilson and Mia Clark have none.

## Tests

`Src/CarStore.Tests/CustomerTests.cs` covers these car cases:
- no car
- a valid car id
- a non-positive id on `Create` and on `Update`
- changing the car
- clearing the car

## Related

- [[Car]]
- [[Domain-Overview]]
- [[Home-Dashboard]]
- [[Testing]]
- [[Customers-Page]]
