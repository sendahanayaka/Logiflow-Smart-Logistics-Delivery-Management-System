using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public VehiclesController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehicleResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var vehicles = await _fleetService.GetAllVehiclesAsync(cancellationToken);
        return Ok(vehicles);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VehicleResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _fleetService.GetVehicleByIdAsync(id, cancellationToken);
        if (vehicle == null)
        {
            return NotFound();
        }

        return Ok(vehicle);
    }

    [HttpPost]
    public async Task<ActionResult<VehicleResponse>> Create([FromBody] CreateVehicleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _fleetService.CreateVehicleAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
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

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VehicleResponse>> Update(Guid id, [FromBody] UpdateVehicleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _fleetService.UpdateVehicleAsync(id, request, cancellationToken);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _fleetService.DeleteVehicleAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
