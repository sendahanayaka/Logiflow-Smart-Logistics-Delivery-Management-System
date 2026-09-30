using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = "Bearer,InternalApiKey", Roles = "ADMIN")]
public class MaintenanceRecordsController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public MaintenanceRecordsController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    /// <summary>
    /// Retrieves all maintenance records.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MaintenanceRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MaintenanceRecordResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var records = await _fleetService.GetAllMaintenanceRecordsAsync(cancellationToken);
        return Ok(records);
    }

    /// <summary>
    /// Retrieves a specific maintenance record by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MaintenanceRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaintenanceRecordResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var record = await _fleetService.GetMaintenanceRecordByIdAsync(id, cancellationToken);
        if (record == null)
        {
            return NotFound(new { message = $"Maintenance record with ID '{id}' was not found." });
        }
        return Ok(record);
    }

    /// <summary>
    /// Retrieves all maintenance records for a specific vehicle.
    /// </summary>
    [HttpGet("vehicle/{vehicleId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<MaintenanceRecordResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<MaintenanceRecordResponse>>> GetByVehicle(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var records = await _fleetService.GetMaintenanceRecordsByVehicleIdAsync(vehicleId, cancellationToken);
            return Ok(records);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Business-Specific Operation: Checks vehicle maintenance status and due date info.
    /// </summary>
    [HttpGet("vehicle/{vehicleId:guid}/status")]
    [ProducesResponseType(typeof(VehicleMaintenanceStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleMaintenanceStatusResponse>> GetVehicleStatus(Guid vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var status = await _fleetService.GetVehicleMaintenanceStatusAsync(vehicleId, cancellationToken);
            return Ok(status);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new maintenance record for a vehicle.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MaintenanceRecordResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaintenanceRecordResponse>> Create([FromBody] CreateMaintenanceRecordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var record = await _fleetService.CreateMaintenanceRecordAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = record.Id }, record);
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
    /// Updates an existing maintenance record.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MaintenanceRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaintenanceRecordResponse>> Update(Guid id, [FromBody] UpdateMaintenanceRecordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updatedRecord = await _fleetService.UpdateMaintenanceRecordAsync(id, request, cancellationToken);
            if (updatedRecord == null)
            {
                return NotFound(new { message = $"Maintenance record with ID '{id}' was not found." });
            }
            return Ok(updatedRecord);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a maintenance record.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _fleetService.DeleteMaintenanceRecordAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Maintenance record with ID '{id}' was not found." });
        }
        return Ok(new { message = "Maintenance record successfully deleted." });
    }
}
