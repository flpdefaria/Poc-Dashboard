namespace CarStore.Web.Models.Api;

public class CreateCustomerRequest
{
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public int? CarId { get; init; }
}
