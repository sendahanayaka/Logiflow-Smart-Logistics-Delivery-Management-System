using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Warehouse;
using LogiFlow.Application.Common;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/warehouse")]
public class WarehouseController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;
    private readonly IValidator<CreateWarehouseRequest> _warehouseValidator;
    private readonly IValidator<CreateStorageZoneRequest> _storageZoneValidator;
    private readonly IValidator<CreatePackageRequest> _packageValidator;

    public WarehouseController(
        IWarehouseService warehouseService,
        IValidator<CreateWarehouseRequest> warehouseValidator,
        IValidator<CreateStorageZoneRequest> storageZoneValidator,
        IValidator<CreatePackageRequest> packageValidator)
    {
        _warehouseService = warehouseService;
        _warehouseValidator = warehouseValidator;
        _storageZoneValidator = storageZoneValidator;
        _packageValidator = packageValidator;
    }

    [HttpPost]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WarehouseResponse>> CreateWarehouse(
        [FromBody] CreateWarehouseRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _warehouseValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var warehouse = await _warehouseService.CreateWarehouseAsync(
                new CreateWarehouseCommand(request.Name, request.Location, request.TotalVolumeM3),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, warehouse);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/zones")]
    [ProducesResponseType(typeof(StorageZoneResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StorageZoneResponse>> CreateStorageZone(
        Guid id,
        [FromBody] CreateStorageZoneRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _storageZoneValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var zone = await _warehouseService.CreateStorageZoneAsync(
                id,
                new CreateStorageZoneCommand(request.Name, request.Code, request.TotalVolumeM3),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, zone);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("intake")]
    [ProducesResponseType(typeof(PackageResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PackageResponse>> ReceivePackage(
        [FromBody] CreatePackageRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _packageValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var package = await _warehouseService.ReceivePackageAsync(
                new ReceivePackageCommand(
                    request.OrderId,
                    request.WarehouseId,
                    request.StorageZoneId,
                    request.TrackingCode,
                    request.WeightKg,
                    request.VolumeM3,
                    request.IsFragile,
                    request.SpecialHandling),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, package);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("{id:guid}/packages")]
    [ProducesResponseType(typeof(PagedResult<PackageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResult<PackageResponse>>> GetPackages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] PackageStatus? status = null,
        [FromQuery] Guid? storageZoneId = null,
        [FromQuery] string? trackingCode = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var packages = await _warehouseService.GetPackagesAsync(
                id,
                new PackageInventoryQuery(page, pageSize, status, storageZoneId, trackingCode),
                cancellationToken);

            return Ok(packages);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private ActionResult ValidationFailure(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray());

        return BadRequest(new ValidationProblemDetails(errors));
    }
}
