using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public AssignmentsController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    /// <summary>
    /// Creates a new driver-vehicle assignment.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssignmentResponse>> Assign([FromBody] CreateAssignmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _fleetService.AssignDriverToVehicleAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, assignment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves all currently active driver-vehicle assignments.
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<AssignmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetActive(CancellationToken cancellationToken)
    {
        var activeAssignments = await _fleetService.GetActiveAssignmentsAsync(cancellationToken);
        return Ok(activeAssignments);
    }

    /// <summary>
    /// Retrieves full assignment audit history (active and completed).
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(IEnumerable<AssignmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetHistory(CancellationToken cancellationToken)
    {
        var history = await _fleetService.GetAssignmentHistoryAsync(cancellationToken);
        return Ok(history);
    }

    /// <summary>
    /// Ends an active driver-vehicle assignment.
    /// </summary>
    [HttpPost("{id:guid}/end")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssignmentResponse>> EndAssignment(Guid id, [FromBody] EndAssignmentRequest? request, CancellationToken cancellationToken)
    {
        try
        {
            var endedAssignment = await _fleetService.EndAssignmentAsync(id, request, cancellationToken);
            return Ok(endedAssignment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
