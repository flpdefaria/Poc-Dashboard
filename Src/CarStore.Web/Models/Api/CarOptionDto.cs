namespace CarStore.Web.Models.Api;

/// <summary>Lookup entry for car dropdowns (e.g. the customer dialogs): <c>Name</c> = "Brand Model".</summary>
public class CarOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
}
