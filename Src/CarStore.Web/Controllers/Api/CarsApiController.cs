using CarStore.Application.Services;
using CarStore.Domain.Entities;
using CarStore.Domain.Exceptions;
using CarStore.Web.Models.Api;
using Microsoft.AspNetCore.Mvc;

namespace CarStore.Web.Controllers.Api;

[ApiController]
[Route("api/cars")]
public class CarsApiController : ControllerBase
{
    private readonly ICarService _carService;

    public CarsApiController(ICarService carService)
    {
        _carService = carService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<CarDto>>> Index(int page = 1, int pageSize = 10)
    {
        var result = await _carService.GetPagedAsync(page, pageSize);
        var dto = new PagedResultDto<CarDto>
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

    [HttpGet("options")]
    public async Task<ActionResult<List<CarOptionDto>>> Options()
    {
        var cars = await _carService.GetAllAsync();
        var dto = cars
            .Select(c => new CarOptionDto { Id = c.Id, Name = $"{c.Brand?.Name} {c.Model}".Trim() })
            .OrderBy(o => o.Name)
            .ToList();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<CarDto>> Create(CreateCarRequest request)
    {
        try
        {
            var car = new Car
            {
                Model = request.Model,
                Vin = request.Vin,
                Description = request.Description,
                BodyType = request.BodyType,
                Price = request.Price,
                Stock = request.Stock,
                ModelYear = request.ModelYear,
                BrandId = request.BrandId
            };
            var created = await _carService.CreateAsync(car, request.Mileage);
            var withBrand = await _carService.GetByIdAsync(created.Id);
            return CreatedAtAction(nameof(Index), new { id = created.Id }, ToDto(withBrand!));
        }
        catch (DomainException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CarDto>> Update(int id, CreateCarRequest request)
    {
        try
        {
            var car = new Car
            {
                Model = request.Model,
                Vin = request.Vin,
                Description = request.Description,
                BodyType = request.BodyType,
                Price = request.Price,
                Stock = request.Stock,
                ModelYear = request.ModelYear,
                BrandId = request.BrandId
            };
            var updated = await _carService.UpdateAsync(id, car, request.Mileage);
            if (updated is null) return NotFound();

            var withBrand = await _carService.GetByIdAsync(id);
            return Ok(ToDto(withBrand!));
        }
        catch (DomainException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _carService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    private static CarDto ToDto(Car c) => new()
    {
        Id = c.Id,
        Model = c.Model,
        Vin = c.Vin,
        Description = c.Description,
        BodyType = c.BodyType,
        Price = c.Price,
        Stock = c.Stock,
        Mileage = c.Mileage,
        IsAvailable = c.IsAvailable,
        ModelYear = c.ModelYear,
        BrandId = c.BrandId,
        BrandName = c.Brand?.Name ?? string.Empty
    };
}
