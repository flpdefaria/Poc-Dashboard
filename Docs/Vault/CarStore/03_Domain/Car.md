---
type: reference
created: 2026-07-22
updated: 2026-11-11
tags:
  - note
  - type/reference
  - area/domain
  - entity/car
---

# Car

The `Car` domain entity: properties, computed members, factory/update methods, and invariants.

## Source

`Src/CarStore.Domain/Entities/Car.cs`

## Properties

| Property | Type | Notes |
|----------|------|-------|
| `Id` | `int` | Database-generated identity. |
| `Model` | `string` | Required, max 250 characters, trimmed. |
| `Vin` | `string` | Max 20 characters, trimmed. |
| `Description` | `string` | Max 2000 characters, trimmed. |
| `BodyType` | `string` | Max 60 characters, trimmed. |
| `Price` | `decimal` | Must be >= 0. |
| `Stock` | `int` | Must be >= 0. |
| `ModelYear` | `int` | Cannot be more than one year in the future. |
| `Mileage` | `int` | Private setter, must be >= 0. |
| `IsAvailable` | `bool` | Computed as `Stock > 0`. |
| `BrandId` | `int` | Foreign key to `Brand`. |
| `Brand` | `Brand?` | Navigation property. |

## Factory and mutators

- `Car.Create(model, vin, description, bodyType, price, stock, modelYear, brandId, mileage)` — validates then returns a new instance.
- `Update(...)` — validates then mutates the existing instance.

## Invariants (exact `DomainException` messages)

| Condition | Message |
|-----------|---------|
| `Model` is null/empty/whitespace | `"Model is required."` |
| `Price` < 0 | `"Price cannot be negative."` |
| `Stock` < 0 | `"Stock cannot be negative."` |
| `ModelYear` more than one year in the future | `"Model year cannot be in the future."` |
| `Mileage` < 0 | `"Mileage cannot be negative."` |

## EF Core mapping

In `Src/CarStore.Domain/Data/CarStoreContext.cs`:

```csharp
modelBuilder.Entity<Car>(entity =>
{
    entity.HasKey(b => b.Id);
    entity.Property(b => b.Model).IsRequired().HasMaxLength(250);
    entity.Property(b => b.Vin).HasMaxLength(20);
    entity.Property(b => b.Description).HasMaxLength(2000);
    entity.Property(b => b.BodyType).HasMaxLength(60);
    entity.Property(b => b.Price).HasPrecision(18, 2);

    entity.HasOne(b => b.Brand)
        .WithMany(a => a.Cars)
        .HasForeignKey(b => b.BrandId)
        .OnDelete(DeleteBehavior.Restrict);
});
```

## Related

- [[Brand]]
- [[Customer]] — customers may link to a car; deleting a car clears those links (`CarService.DeleteAsync`).
- [[Domain-Overview]]
- [[Architecture-Overview]]
