using CarStore.Domain.Entities;
using CarStore.Domain.Exceptions;
using FluentAssertions;

namespace CarStore.Tests;

public class CustomerTests
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Customer ValidCustomer() =>
        Customer.Create("Jane Doe", "jane.doe@example.com", "555-1234");

    // ── Customer.Create – happy path ──────────────────────────────────────────

    [Fact]
    public void Create_WithValidData_ReturnsNonNullCustomer()
    {
        // Arrange & Act
        var customer = Customer.Create("Jane Doe", "jane.doe@example.com", "555-1234");

        // Assert
        customer.Should().NotBeNull();
        customer.FullName.Should().Be("Jane Doe");
        customer.Email.Should().Be("jane.doe@example.com");
        customer.PhoneNumber.Should().Be("555-1234");
        customer.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ── Customer.Create – full name validation ────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyOrWhitespaceFullName_ThrowsDomainException(string fullName)
    {
        // Arrange & Act
        var act = () => Customer.Create(fullName, "jane.doe@example.com", null);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer full name is required.");
    }

    [Fact]
    public void Create_WithFullNameOver150Characters_ThrowsDomainException()
    {
        // Arrange
        var fullName = new string('a', 151);

        // Act
        var act = () => Customer.Create(fullName, "jane.doe@example.com", null);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer full name must be at most 150 characters.");
    }

    // ── Customer.Create – email validation ────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyOrWhitespaceEmail_ThrowsDomainException(string email)
    {
        // Arrange & Act
        var act = () => Customer.Create("Jane Doe", email, null);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer email is required.");
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("missing-at-sign.com")]
    [InlineData("user@nodot")]
    public void Create_WithInvalidEmailFormat_ThrowsDomainException(string email)
    {
        // Arrange & Act
        var act = () => Customer.Create("Jane Doe", email, null);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer email is invalid.");
    }

    // ── Customer.Update – happy path ──────────────────────────────────────────

    [Fact]
    public void Update_WithValidData_AppliesChanges()
    {
        // Arrange
        var customer = ValidCustomer();

        // Act
        customer.Update("John Smith", "john.smith@example.com", "555-9876");

        // Assert
        customer.FullName.Should().Be("John Smith");
        customer.Email.Should().Be("john.smith@example.com");
        customer.PhoneNumber.Should().Be("555-9876");
    }

    // ── Customer car link ─────────────────────────────────────────────────────

    [Fact]
    public void Create_WithoutCar_LeavesCarIdNull()
    {
        // Arrange & Act
        var customer = ValidCustomer();

        // Assert
        customer.CarId.Should().BeNull();
    }

    [Fact]
    public void Create_WithCarId_SetsCarId()
    {
        // Arrange & Act
        var customer = Customer.Create("Jane Doe", "jane.doe@example.com", null, 7);

        // Assert
        customer.CarId.Should().Be(7);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_WithNonPositiveCarId_ThrowsDomainException(int carId)
    {
        // Arrange & Act
        var act = () => Customer.Create("Jane Doe", "jane.doe@example.com", null, carId);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer car id is invalid.");
    }

    [Fact]
    public void Update_WithCarId_ChangesCar()
    {
        // Arrange
        var customer = Customer.Create("Jane Doe", "jane.doe@example.com", null, 3);

        // Act
        customer.Update("Jane Doe", "jane.doe@example.com", null, 5);

        // Assert
        customer.CarId.Should().Be(5);
    }

    [Fact]
    public void Update_WithNullCarId_ClearsCar()
    {
        // Arrange
        var customer = Customer.Create("Jane Doe", "jane.doe@example.com", null, 3);

        // Act
        customer.Update("Jane Doe", "jane.doe@example.com", null, null);

        // Assert
        customer.CarId.Should().BeNull();
    }

    [Fact]
    public void Update_WithNonPositiveCarId_ThrowsDomainException()
    {
        // Arrange
        var customer = ValidCustomer();

        // Act
        var act = () => customer.Update("Jane Doe", "jane.doe@example.com", null, 0);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("Customer car id is invalid.");
    }
}
