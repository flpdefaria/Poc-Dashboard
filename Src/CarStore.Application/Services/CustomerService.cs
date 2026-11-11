using CarStore.Application.Common;
using CarStore.Domain.Data;
using CarStore.Domain.Entities;
using CarStore.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CarStore.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly CarStoreContext _db;

    public CustomerService(CarStoreContext db)
    {
        _db = db;
    }

    public async Task<List<Customer>> GetAllAsync()
    {
        return await WithCar()
            .OrderBy(c => c.FullName)
            .ToListAsync();
    }

    public async Task<PagedResult<Customer>> GetPagedAsync(int pageNumber, int pageSize)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = WithCar().OrderBy(c => c.FullName);
        var total = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<Customer> { Items = items, PageNumber = pageNumber, PageSize = pageSize, TotalItems = total };
    }

    public async Task<Customer?> GetByIdAsync(int id)
    {
        return await WithCar()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Customer> CreateAsync(Customer customer)
    {
        var entity = Customer.Create(customer.FullName, customer.Email, customer.PhoneNumber, customer.CarId);
        await EnsureCarExistsAsync(entity.CarId);
        _db.Customers.Add(entity);
        await _db.SaveChangesAsync();
        await LoadCarAsync(entity);
        return entity;
    }

    public async Task<Customer?> UpdateAsync(int id, Customer customer)
    {
        var existing = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (existing is null)
            return null;

        existing.Update(customer.FullName, customer.Email, customer.PhoneNumber, customer.CarId);
        await EnsureCarExistsAsync(existing.CarId);
        await _db.SaveChangesAsync();
        await LoadCarAsync(existing);
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);

        if (existing is null)
            return false;

        _db.Customers.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    private IQueryable<Customer> WithCar() =>
        _db.Customers.Include(c => c.Car).ThenInclude(car => car!.Brand);

    private async Task EnsureCarExistsAsync(int? carId)
    {
        if (carId is null)
            return;

        var carExists = await _db.Cars.AnyAsync(car => car.Id == carId);
        if (!carExists)
            throw new DomainException("Car does not exist.");
    }

    private async Task LoadCarAsync(Customer customer)
    {
        var entry = _db.Entry(customer).Reference(c => c.Car);
        await entry.LoadAsync();
        if (customer.Car is not null)
            await _db.Entry(customer.Car).Reference(car => car.Brand).LoadAsync();
    }
}
