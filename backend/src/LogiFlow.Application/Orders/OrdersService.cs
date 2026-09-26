using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Orders;

public class OrdersService : IOrdersService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public OrdersService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    private Guid GetAuthenticatedCustomerId()
    {
        if (_currentUserService.UserId is null)
        {
            throw new UnauthorizedAccessException("You must be authenticated to perform this action.");
        }
        return _currentUserService.UserId.Value;
    }

    public async Task<DeliveryOrderResponse> CreateOrderAsync(
        CreateDeliveryOrderCommand command,
        CancellationToken cancellationToken = default)
    {
        var customerId = GetAuthenticatedCustomerId();

        ValidateOrder(command);

        if (!Enum.TryParse<DeliveryPriority>(command.Priority, true, out var priority))
        {
            throw new ArgumentException("Invalid delivery priority.", nameof(command.Priority));
        }

        var order = new DeliveryOrder
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            PickupAddress = command.PickupAddress.Trim(),
            PickupCity = command.PickupCity.Trim(),
            DeliveryAddress = command.DeliveryAddress.Trim(),
            DeliveryCity = command.DeliveryCity.Trim(),
            PreferredPickupDate = command.PreferredPickupDate,
            PreferredPickupTime = command.PreferredPickupTime,
            Priority = priority,
            PackageDescription = command.PackageDescription.Trim(),
            WeightKg = command.WeightKg,
            LengthCm = command.LengthCm,
            WidthCm = command.WidthCm,
            HeightCm = command.HeightCm,
            SpecialHandling = NormalizeOptional(command.SpecialHandling),
            RecipientName = NormalizeOptional(command.RecipientName),
            RecipientContact = NormalizeOptional(command.RecipientContact),
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return MapOrder(order);
    }

    public async Task<IEnumerable<DeliveryOrderResponse>> GetMyOrdersAsync(
        CancellationToken cancellationToken = default)
    {
        var customerId = GetAuthenticatedCustomerId();

        var orders = await _context.DeliveryOrders
            .AsNoTracking()
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(MapOrder);
    }

    public async Task<DeliveryOrderResponse> GetOrderByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var customerId = GetAuthenticatedCustomerId();

        var order = await _context.DeliveryOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId, cancellationToken);

        if (order is null)
        {
            throw new KeyNotFoundException($"Order '{id}' was not found.");
        }

        return MapOrder(order);
    }

    public async Task<DeliveryOrderResponse> CancelOrderAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var customerId = GetAuthenticatedCustomerId();

        var order = await _context.DeliveryOrders
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId, cancellationToken);

        if (order is null)
        {
            throw new KeyNotFoundException($"Order '{id}' was not found.");
        }

        if (order.Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot cancel order in status '{order.Status}'. Only Pending orders can be cancelled.");
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapOrder(order);
    }

    private static void ValidateOrder(CreateDeliveryOrderCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.PickupAddress))
        {
            throw new ArgumentException("Pickup address is required.", nameof(command.PickupAddress));
        }

        if (string.IsNullOrWhiteSpace(command.PickupCity))
        {
            throw new ArgumentException("Pickup city is required.", nameof(command.PickupCity));
        }

        if (string.IsNullOrWhiteSpace(command.DeliveryAddress))
        {
            throw new ArgumentException("Delivery address is required.", nameof(command.DeliveryAddress));
        }

        if (string.IsNullOrWhiteSpace(command.DeliveryCity))
        {
            throw new ArgumentException("Delivery city is required.", nameof(command.DeliveryCity));
        }

        if (string.IsNullOrWhiteSpace(command.PackageDescription))
        {
            throw new ArgumentException("Package description is required.", nameof(command.PackageDescription));
        }

        if (command.PreferredPickupDate < DateTime.UtcNow.Date)
        {
            throw new ArgumentException("Preferred pickup date cannot be in the past.", nameof(command.PreferredPickupDate));
        }

        if (command.WeightKg <= 0)
        {
            throw new ArgumentException("Weight must be greater than zero.", nameof(command.WeightKg));
        }

        if (command.LengthCm <= 0)
        {
            throw new ArgumentException("Length must be greater than zero.", nameof(command.LengthCm));
        }

        if (command.WidthCm <= 0)
        {
            throw new ArgumentException("Width must be greater than zero.", nameof(command.WidthCm));
        }

        if (command.HeightCm <= 0)
        {
            throw new ArgumentException("Height must be greater than zero.", nameof(command.HeightCm));
        }

        if (!string.IsNullOrWhiteSpace(command.RecipientContact) && command.RecipientContact.Length < 3)
        {
            throw new ArgumentException("Recipient contact format is invalid.", nameof(command.RecipientContact));
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DeliveryOrderResponse MapOrder(DeliveryOrder order) =>
        new(
            order.Id,
            order.CustomerId,
            order.PickupAddress,
            order.PickupCity,
            order.DeliveryAddress,
            order.DeliveryCity,
            order.PackageDescription,
            order.SpecialHandling,
            order.PreferredPickupDate,
            order.PreferredPickupTime,
            order.Priority.ToString(),
            order.WeightKg,
            order.LengthCm,
            order.WidthCm,
            order.HeightCm,
            order.RecipientName,
            order.RecipientContact,
            order.Status.ToString(),
            order.CreatedAt,
            order.UpdatedAt);
}
