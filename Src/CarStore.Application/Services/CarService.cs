using CarStore.Application.Common;
using CarStore.Domain.Data;
using CarStore.Domain.Entities;
using CarStore.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CarStore.Application.Services;

public class CarService : ICarService
{
    private readonly CarStoreContext _db;

    public CarService(CarStoreContext db)
    {
        _db = db;
    }

    public async Task<List<Car>> GetAllAsync()
    {
        return await _db.Cars
            .Include(b => b.Brand)
            .OrderBy(b => b.Model)
            .ToListAsync();
    }

    public async Task<PagedResult<Car>> GetPagedAsync(int pageNumber, int pageSize)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.Cars.Include(b => b.Brand).OrderBy(b => b.Model);
        var total = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<Car> { Items = items, PageNumber = pageNumber, PageSize = pageSize, TotalItems = total };
    }

    public async Task<Car?> GetByIdAsync(int id)
    {
        return await _db.Cars
            .Include(b => b.Brand)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Car> CreateAsync(Car car, int mileage)
    {
        var brandExists = await _db.Brands.AnyAsync(a => a.Id == car.BrandId);
        if (!brandExists)
            throw new DomainException("Brand does not exist.");

        var entity = Car.Create(car.Model, car.Vin, car.Description, car.BodyType, car.Price, car.Stock, car.ModelYear, car.BrandId, mileage);
        _db.Cars.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task<Car?> UpdateAsync(int id, Car car, int mileage)
    {
        var existing = await _db.Cars.FirstOrDefaultAsync(b => b.Id == id);
        if (existing is null)
            return null;

        var brandExists = await _db.Brands.AnyAsync(a => a.Id == car.BrandId);
        if (!brandExists)
            throw new DomainException("Brand does not exist.");

        existing.Update(car.Model, car.Vin, car.Description, car.BodyType, car.Price, car.Stock, car.ModelYear, car.BrandId, mileage);
        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _db.Cars.FirstOrDefaultAsync(b => b.Id == id);
        if (existing is null)
            return false;

        // Loading the linked customers lets EF apply the optional relationship's SetNull: the in-memory
        // provider has no database FK, so untracked customers would keep a dangling CarId.
        await _db.Customers.Where(c => c.CarId == id).LoadAsync();
        _db.Cars.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }
}
