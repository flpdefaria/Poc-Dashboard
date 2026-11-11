namespace CarStore.Web.Models.Api;

public class CustomerDto
{
    public int Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public DateTime CreatedAt { get; init; }
    public int? CarId { get; init; }
    /// <summary>Brand + model of the linked car (e.g. "Toyota Corolla"), or null.</summary>
    public string? CarName { get; init; }
}
