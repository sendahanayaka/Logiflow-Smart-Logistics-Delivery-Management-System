using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Orders;
using LogiFlow.Application.Orders;
using LogiFlow.Application.Orders.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrdersService _ordersService;
    private readonly IValidator<CreateDeliveryOrderRequest> _orderValidator;

    public OrdersController(
        IOrdersService ordersService,
        IValidator<CreateDeliveryOrderRequest> orderValidator)
    {
        _ordersService = ordersService;
        _orderValidator = orderValidator;
    }

    [HttpPost]
    [ProducesResponseType(typeof(DeliveryOrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DeliveryOrderResponse>> CreateOrder(
        [FromBody] CreateDeliveryOrderRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _orderValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        try
        {
            var command = new CreateDeliveryOrderCommand(
                request.PickupAddress,
                request.PickupCity,
                request.DeliveryAddress,
                request.DeliveryCity,
                request.PackageDescription,
                request.SpecialHandling,
                request.PreferredPickupDate,
                request.PreferredPickupTime,
                request.Priority,
                request.WeightKg,
                request.LengthCm,
                request.WidthCm,
                request.HeightCm,
                request.RecipientName,
                request.RecipientContact);

            var order = await _ordersService.CreateOrderAsync(command, cancellationToken);

            return StatusCode(StatusCodes.Status201Created, order);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(IEnumerable<DeliveryOrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<DeliveryOrderResponse>>> GetMyOrders(
        CancellationToken cancellationToken)
    {
        var orders = await _ordersService.GetMyOrdersAsync(cancellationToken);
        return Ok(orders);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DeliveryOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeliveryOrderResponse>> GetOrderById(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var order = await _ordersService.GetOrderByIdAsync(id, cancellationToken);
            return Ok(order);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    [HttpPatch("{id:guid}/cancel")]
    [ProducesResponseType(typeof(DeliveryOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DeliveryOrderResponse>> CancelOrder(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var order = await _ordersService.CancelOrderAsync(id, cancellationToken);
            return Ok(order);
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
