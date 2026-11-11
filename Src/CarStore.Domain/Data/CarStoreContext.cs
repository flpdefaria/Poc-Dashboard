using CarStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarStore.Domain.Data;

public class CarStoreContext : DbContext
{
    public CarStoreContext(DbContextOptions<CarStoreContext> options) : base(options) { }

    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Name).IsRequired().HasMaxLength(150);
            entity.Property(a => a.Description).HasMaxLength(2000);
            entity.Property(a => a.Country).HasMaxLength(100);
        });

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

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.FullName).IsRequired().HasMaxLength(150);
            entity.Property(c => c.Email).IsRequired().HasMaxLength(256);
            entity.Property(c => c.PhoneNumber).HasMaxLength(50);

            // Optional link: deleting a car keeps the customer and clears the link.
            entity.HasOne(c => c.Car)
                .WithMany()
                .HasForeignKey(c => c.CarId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
