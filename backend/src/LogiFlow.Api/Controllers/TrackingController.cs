// [S4]  TrackingController
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/tracking")]
[Authorize(Roles = "ADMIN,CUSTOMER,DRIVER")]
public class TrackingController : ControllerBase
{
    private readonly IShipmentService _shipments;

    public TrackingController(IShipmentService shipments)
    {
        _shipments = shipments;
    }

    /// <summary>Customer / ops live-tracking timeline for a shipment.</summary>
    [HttpGet("{shipmentId:guid}")]
    [ProducesResponseType(typeof(TrackingView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackingView>> Get(Guid shipmentId, CancellationToken cancellationToken)
    {
        var tracking = await _shipments.GetTrackingAsync(shipmentId, cancellationToken);
        return tracking is null ? NotFound() : Ok(tracking);
    }
}
