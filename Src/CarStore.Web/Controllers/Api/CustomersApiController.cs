using CarStore.Application.Services;
using CarStore.Domain.Entities;
using CarStore.Domain.Exceptions;
using CarStore.Web.Models.Api;
using Microsoft.AspNetCore.Mvc;

namespace CarStore.Web.Controllers.Api;

[ApiController]
[Route("api/customers")]
public class CustomersApiController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersApiController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<CustomerDto>>> Index(int page = 1, int pageSize = 10)
    {
        var result = await _customerService.GetPagedAsync(page, pageSize);
        var dto = new PagedResultDto<CustomerDto>
        {
            Items = result.Items.Select(ToDto).ToList(),
            PageNumber = result.PageNumber,
            PageSize = result.PageSize,
            TotalItems = result.TotalItems,
            TotalPages = result.TotalPages,
            HasPrevious = result.HasPrevious,
            HasNext = result.HasNext
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create(CreateCustomerRequest request)
    {
        try
        {
            var customer = new Customer
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                CarId = request.CarId
            };
            var created = await _customerService.CreateAsync(customer);
            return CreatedAtAction(nameof(Index), new { id = created.Id }, ToDto(created));
        }
        catch (DomainException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, CreateCustomerRequest request)
    {
        try
        {
            var customer = new Customer
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                CarId = request.CarId
            };
            var updated = await _customerService.UpdateAsync(id, customer);
            if (updated is null) return NotFound();

            return Ok(ToDto(updated));
        }
        catch (DomainException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _customerService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    private static CustomerDto ToDto(Customer c) => new()
    {
        Id = c.Id,
        FullName = c.FullName,
        Email = c.Email,
        PhoneNumber = c.PhoneNumber,
        CreatedAt = c.CreatedAt,
        CarId = c.CarId,
        CarName = c.Car is null ? null : $"{c.Car.Brand?.Name} {c.Car.Model}".Trim()
    };
}
