using System.Text.RegularExpressions;
using CarStore.Domain.Exceptions;

namespace CarStore.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>The car the customer is linked to (optional). Existence is checked by the application service.</summary>
    public int? CarId { get; set; }
    public Car? Car { get; set; }

    public static Customer Create(string fullName, string email, string? phoneNumber, int? carId = null)
    {
        Validate(fullName, email, carId);
        return new Customer
        {
            FullName = fullName.Trim(),
            Email = email.Trim(),
            PhoneNumber = phoneNumber?.Trim(),
            CarId = carId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string fullName, string email, string? phoneNumber, int? carId = null)
    {
        Validate(fullName, email, carId);
        FullName = fullName.Trim();
        Email = email.Trim();
        PhoneNumber = phoneNumber?.Trim();
        CarId = carId;
    }

    private static void Validate(string fullName, string email, int? carId)
    {
        if (carId is <= 0)
            throw new DomainException("Customer car id is invalid.");

        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainException("Customer full name is required.");

        if (fullName.Length > 150)
            throw new DomainException("Customer full name must be at most 150 characters.");

        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Customer email is required.");

        if (!IsValidEmail(email.Trim()))
            throw new DomainException("Customer email is invalid.");
    }

    private static bool IsValidEmail(string email)
    {
        return Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
    }
}
