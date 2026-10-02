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

    /// <summary>Customer-facing tracking for one of their orders (status + driver contact + their stop).</summary>
    [HttpGet("order/{orderId:guid}")]
    [ProducesResponseType(typeof(CustomerOrderTrackingView), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderTrackingView>> GetByOrder(Guid orderId, CancellationToken cancellationToken)
    {
        return Ok(await _shipments.GetOrderTrackingAsync(orderId, cancellationToken));
    }

    /// <summary>Track by the friendly shipment code (e.g. for a customer who has the code).</summary>
    [HttpGet("code/{shipmentCode}")]
    [ProducesResponseType(typeof(TrackingView), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrackingView>> GetByCode(string shipmentCode, CancellationToken cancellationToken)
    {
        var tracking = await _shipments.GetTrackingByCodeAsync(shipmentCode, cancellationToken);
        return tracking is null ? NotFound() : Ok(tracking);
    }
}
