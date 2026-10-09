// [S4]  ShipmentsController
using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Delivery;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/shipments")]
[Authorize(Roles = "DRIVER,ADMIN")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipments;
    private readonly IFleetService _fleet;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<RecordStopEventRequest> _eventValidator;
    private readonly IValidator<RecordPodRequest> _podValidator;

    public ShipmentsController(
        IShipmentService shipments,
        IFleetService fleet,
        ICurrentUserService currentUser,
        IValidator<RecordStopEventRequest> eventValidator,
        IValidator<RecordPodRequest> podValidator)
    {
        _shipments = shipments;
        _fleet = fleet;
        _currentUser = currentUser;
        _eventValidator = eventValidator;
        _podValidator = podValidator;
    }

    /// <summary>The driver's assigned run (ordered stops + statuses + ETAs).</summary>
    [HttpGet("{id:guid}/run")]
    [ProducesResponseType(typeof(DriverRunView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DriverRunView>> GetRun(Guid id, CancellationToken cancellationToken)
    {
        var run = await _shipments.GetDriverRunAsync(id, cancellationToken);
        return run is null ? NotFound() : Ok(run);
    }

    /// <summary>The signed-in driver's own assigned runs.</summary>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(IReadOnlyList<ShipmentSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ShipmentSummary>>> Mine(CancellationToken cancellationToken)
    {
        return Ok(await _shipments.GetMyRunsAsync(cancellationToken));
    }

    /// <summary>
    /// Driver self-service: ends the signed-in driver's active assignment after they
    /// finish a run, freeing the driver and the vehicle for reassignment.
    /// </summary>
    [HttpPost("mine/end-assignment")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssignmentResponse>> EndMyAssignment(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await _fleet.EndActiveAssignmentForUserAsync(userId.Value, cancellationToken));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    /// <summary>Admin/ops list of all dispatched shipments.</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(IReadOnlyList<ShipmentSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ShipmentSummary>>> List(CancellationToken cancellationToken)
    {
        return Ok(await _shipments.ListShipmentsAsync(cancellationToken));
    }

    /// <summary>Driver opens the assigned run → moves it to "picked up" (Dispatched).</summary>
    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(DriverRunView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DriverRunView>> StartRun(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _shipments.StartRunAsync(id, cancellationToken));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    /// <summary>Driver reports progress at a stop (ARRIVED recomputes downstream ETAs).</summary>
    [HttpPost("{id:guid}/events")]
    [ProducesResponseType(typeof(TrackingView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackingView>> RecordEvent(
        Guid id, [FromBody] RecordStopEventRequest request, CancellationToken cancellationToken)
    {
        var validation = await _eventValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationFailure(validation);
        }

        try
        {
            var result = await _shipments.RecordStopEventAsync(id,
                new RecordStopEventCommand(request.StopKey, request.Kind, request.OccurredAt,
                    request.Note, request.Latitude, request.Longitude),
                cancellationToken);
            return Ok(result);
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

    /// <summary>Capture proof of delivery for a stop.</summary>
    [HttpPost("{id:guid}/pod")]
    [ProducesResponseType(typeof(TrackingView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TrackingView>> RecordPod(
        Guid id, [FromBody] RecordPodRequest request, CancellationToken cancellationToken)
    {
        var validation = await _podValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationFailure(validation);
        }

        try
        {
            var result = await _shipments.RecordProofOfDeliveryAsync(id,
                new RecordPodCommand(request.StopKey, request.ReceivedByName, request.SignatureImageUrl,
                    request.PhotoUrl, request.Notes, request.DeliveredAt),
                cancellationToken);
            return Ok(result);
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

    private ActionResult ValidationFailure(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray());
        return BadRequest(new ValidationProblemDetails(errors));
    }
}
