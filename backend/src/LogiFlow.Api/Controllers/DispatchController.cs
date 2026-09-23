using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Warehouse;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/dispatch")]
public sealed class DispatchController : ControllerBase
{
    private readonly IDispatchBatchService _dispatchBatchService;
    private readonly IValidator<CreateDispatchBatchRequest> _createBatchValidator;
    private readonly IValidator<ReplaceDispatchBatchItemsRequest> _replaceItemsValidator;

    public DispatchController(
        IDispatchBatchService dispatchBatchService,
        IValidator<CreateDispatchBatchRequest> createBatchValidator,
        IValidator<ReplaceDispatchBatchItemsRequest> replaceItemsValidator)
    {
        _dispatchBatchService = dispatchBatchService;
        _createBatchValidator = createBatchValidator;
        _replaceItemsValidator = replaceItemsValidator;
    }

    [HttpPost("batches")]
    [ProducesResponseType(typeof(DispatchBatchResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DispatchBatchResponse>> CreateBatch(
        [FromBody] CreateDispatchBatchRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _createBatchValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var batch = await _dispatchBatchService.CreateBatchAsync(
                new CreateDispatchBatchCommand(
                    request.WarehouseId,
                    new VehicleCapacityContext(
                        request.VehicleId,
                        request.MaxWeightKg,
                        request.MaxVolumeM3),
                    request.PackageIds),
                cancellationToken);

            return Created($"/api/dispatch/batches/{batch.Id}", batch);
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

    [HttpPut("batches/{id:guid}/items")]
    [ProducesResponseType(typeof(DispatchBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DispatchBatchResponse>> ReplaceBatchItems(
        Guid id,
        [FromBody] ReplaceDispatchBatchItemsRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _replaceItemsValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            return Ok(await _dispatchBatchService.ReplaceItemsAsync(
                id,
                new ReplaceDispatchBatchItemsCommand(request.PackageIds),
                cancellationToken));
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

    [HttpGet("batches/{id:guid}/validation")]
    [ProducesResponseType(typeof(DispatchBatchValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DispatchBatchValidationResponse>> GetValidation(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _dispatchBatchService.GetValidationAsync(id, cancellationToken));
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
