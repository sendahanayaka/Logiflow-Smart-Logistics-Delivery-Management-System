using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Warehouse;
using LogiFlow.Application.Common;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/warehouse")]
[Authorize(AuthenticationSchemes = "Bearer,InternalApiKey", Roles = "WAREHOUSE_STAFF,ADMIN")]
public class WarehouseController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;
    private readonly IValidator<CreateWarehouseRequest> _warehouseValidator;
    private readonly IValidator<CreateStorageZoneRequest> _storageZoneValidator;
    private readonly IValidator<CreatePackageRequest> _packageValidator;
    private readonly IValidator<UpdateWarehouseRequest> _updateWarehouseValidator;
    private readonly IValidator<UpdateStorageZoneRequest> _updateStorageZoneValidator;
    private readonly IValidator<UpdatePackageRequest> _updatePackageValidator;
    private readonly IDispatchBatchService _dispatchBatchService;

    public WarehouseController(
        IWarehouseService warehouseService,
        IValidator<CreateWarehouseRequest> warehouseValidator,
        IValidator<CreateStorageZoneRequest> storageZoneValidator,
        IValidator<CreatePackageRequest> packageValidator,
        IValidator<UpdateWarehouseRequest> updateWarehouseValidator,
        IValidator<UpdateStorageZoneRequest> updateStorageZoneValidator,
        IValidator<UpdatePackageRequest> updatePackageValidator,
        IDispatchBatchService dispatchBatchService)
    {
        _warehouseService = warehouseService;
        _warehouseValidator = warehouseValidator;
        _storageZoneValidator = storageZoneValidator;
        _packageValidator = packageValidator;
        _updateWarehouseValidator = updateWarehouseValidator;
        _updateStorageZoneValidator = updateStorageZoneValidator;
        _updatePackageValidator = updatePackageValidator;
        _dispatchBatchService = dispatchBatchService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<WarehouseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<WarehouseResponse>>> GetWarehouses(
        CancellationToken cancellationToken)
    {
        return Ok(await _warehouseService.GetWarehousesAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WarehouseResponse>> GetWarehouse(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _warehouseService.GetWarehouseAsync(id, cancellationToken));
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

    [HttpGet("{id:guid}/zones")]
    [ProducesResponseType(typeof(IReadOnlyCollection<StorageZoneResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyCollection<StorageZoneResponse>>> GetStorageZones(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _warehouseService.GetStorageZonesAsync(id, cancellationToken));
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

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WarehouseResponse>> UpdateWarehouse(
        Guid id,
        [FromBody] UpdateWarehouseRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _updateWarehouseValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var warehouse = await _warehouseService.UpdateWarehouseAsync(
                id,
                new UpdateWarehouseCommand(request.Name, request.Location, request.TotalVolumeM3),
                cancellationToken);

            return Ok(warehouse);
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

    [HttpPut("{id:guid}/zones/{zoneId:guid}")]
    [ProducesResponseType(typeof(StorageZoneResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StorageZoneResponse>> UpdateStorageZone(
        Guid id,
        Guid zoneId,
        [FromBody] UpdateStorageZoneRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _updateStorageZoneValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var zone = await _warehouseService.UpdateStorageZoneAsync(
                id,
                zoneId,
                new UpdateStorageZoneCommand(request.Name, request.Code, request.TotalVolumeM3),
                cancellationToken);

            return Ok(zone);
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

    [HttpPatch("packages/{id:guid}/availability")]
    [ProducesResponseType(typeof(PackageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PackageResponse>> MakePackageAvailable(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _warehouseService.MakePackageAvailableAsync(id, cancellationToken));
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

    [HttpPut("packages/{id:guid}")]
    [ProducesResponseType(typeof(PackageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PackageResponse>> UpdatePackage(
        Guid id,
        [FromBody] UpdatePackageRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _updatePackageValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var package = await _warehouseService.UpdatePackageAsync(
                id,
                new UpdatePackageCommand(
                    request.StorageZoneId,
                    request.WeightKg,
                    request.VolumeM3,
                    request.IsFragile,
                    request.SpecialHandling),
                cancellationToken);

            return Ok(package);
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

    [HttpGet("{id:guid}/reports/throughput")]
    [ProducesResponseType(typeof(WarehouseThroughputResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WarehouseThroughputResponse>> GetThroughput(
        Guid id,
        [FromQuery] DateTime fromUtc,
        [FromQuery] DateTime toUtc,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _dispatchBatchService.GetThroughputAsync(
                id,
                new WarehouseThroughputQuery(fromUtc, toUtc),
                cancellationToken));
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
