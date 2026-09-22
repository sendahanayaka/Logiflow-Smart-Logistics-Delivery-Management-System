using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DriversController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public DriversController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DriverResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var drivers = await _fleetService.GetAllDriversAsync(cancellationToken);
        return Ok(drivers);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DriverResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var driver = await _fleetService.GetDriverByIdAsync(id, cancellationToken);
        if (driver == null)
        {
            return NotFound();
        }

        return Ok(driver);
    }

    [HttpPost]
    public async Task<ActionResult<DriverResponse>> Create([FromBody] CreateDriverRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _fleetService.CreateDriverAsync(request, cancellationToken);
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
    public async Task<ActionResult<DriverResponse>> Update(Guid id, [FromBody] UpdateDriverRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _fleetService.UpdateDriverAsync(id, request, cancellationToken);
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
        var deleted = await _fleetService.DeleteDriverAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
