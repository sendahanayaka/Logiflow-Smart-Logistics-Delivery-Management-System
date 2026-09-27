using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DutySchedulesController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public DutySchedulesController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    /// <summary>
    /// Retrieves all duty schedules.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DutyScheduleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DutyScheduleResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var schedules = await _fleetService.GetAllDutySchedulesAsync(cancellationToken);
        return Ok(schedules);
    }

    /// <summary>
    /// Retrieves a specific duty schedule by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DutyScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DutyScheduleResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var schedule = await _fleetService.GetDutyScheduleByIdAsync(id, cancellationToken);
        if (schedule == null)
        {
            return NotFound(new { message = $"Duty schedule with ID '{id}' was not found." });
        }
        return Ok(schedule);
    }

    /// <summary>
    /// Retrieves all duty schedules for a specific driver.
    /// </summary>
    [HttpGet("driver/{driverId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<DutyScheduleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<DutyScheduleResponse>>> GetByDriver(Guid driverId, CancellationToken cancellationToken)
    {
        try
        {
            var schedules = await _fleetService.GetDutySchedulesByDriverIdAsync(driverId, cancellationToken);
            return Ok(schedules);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Business-Specific Operation: Checks whether a driver is scheduled/available during the requested time period.
    /// </summary>
    [HttpGet("driver/{driverId:guid}/availability")]
    [ProducesResponseType(typeof(DriverAvailabilityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DriverAvailabilityResponse>> CheckAvailability(
        Guid driverId,
        [FromQuery] DateTime startTime,
        [FromQuery] DateTime endTime,
        CancellationToken cancellationToken)
    {
        try
        {
            var availability = await _fleetService.CheckDriverScheduleAvailabilityAsync(driverId, startTime, endTime, cancellationToken);
            return Ok(availability);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new duty schedule for a driver.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DutyScheduleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DutyScheduleResponse>> Create([FromBody] CreateDutyScheduleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var schedule = await _fleetService.CreateDutyScheduleAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = schedule.Id }, schedule);
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
    /// Updates an existing duty schedule.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DutyScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DutyScheduleResponse>> Update(Guid id, [FromBody] UpdateDutyScheduleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updatedSchedule = await _fleetService.UpdateDutyScheduleAsync(id, request, cancellationToken);
            if (updatedSchedule == null)
            {
                return NotFound(new { message = $"Duty schedule with ID '{id}' was not found." });
            }
            return Ok(updatedSchedule);
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
    /// Deletes a duty schedule.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _fleetService.DeleteDutyScheduleAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Duty schedule with ID '{id}' was not found." });
        }
        return Ok(new { message = "Duty schedule successfully deleted." });
    }
}
