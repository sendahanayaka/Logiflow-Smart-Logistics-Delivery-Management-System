using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Orders;
using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace LogiFlow.UnitTests.Orders;

public sealed class OrdersServiceTests : IAsyncLifetime
{
    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private StubCurrentUserService _currentUserService = null!;
    private StubIntelligenceService _intelligenceService = null!;
    private StubPricingService _pricingService = null!;
    private OrdersService _service = null!;
    
    private readonly Guid _authUserId = Guid.NewGuid();

    private sealed class StubCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; }
    }

    private sealed class StubIntelligenceService : IOrderIntelligenceService
    {
        public OrderIntelligenceResponse Analyze(DeliveryOrder order) => new OrderIntelligenceResponse(
            0.1m, "Light", "Standard", "Standard", new List<string>());
    }

    private sealed class StubPricingService : IDeliveryPricingService
    {
        public DeliveryFeeBreakdown CalculateFee(DeliveryOrder order, string handlingRequirement, decimal distanceKm) => new DeliveryFeeBreakdown(
            10m, 5m, 2m, 1m, 0m, 0m, 18m);
    }

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"orders-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
            
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        
        _currentUserService = new StubCurrentUserService { UserId = _authUserId };
        _intelligenceService = new StubIntelligenceService();
        _pricingService = new StubPricingService();

        _service = new OrdersService(
            _context, 
            _currentUserService, 
            _intelligenceService, 
            _pricingService);
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    private CreateDeliveryOrderCommand GetValidCommand() => new(
        "123 Valid St",
        "Colombo",
        "456 Dest St",
        "Kandy",
        "Box of electronics",
        "Fragile",
        DateTime.UtcNow.AddDays(1).Date,
        new TimeSpan(10, 0, 0),
        "Standard",
        5.0m,
        20.0m,
        20.0m,
        20.0m,
        "John Doe",
        "0771234567"
    );

    [Fact]
    public async Task CreateOrderAsync_CreatesOrderSuccessfully_SetsInitialStatusAndCreatesNotification()
    {
        var command = GetValidCommand();

        var response = await _service.CreateOrderAsync(command);

        Assert.Equal(_authUserId, response.CustomerId);
        Assert.Equal(OrderStatus.Pending.ToString(), response.Status);
        
        var persistedOrder = await _context.DeliveryOrders.SingleOrDefaultAsync(o => o.Id == response.Id);
        Assert.NotNull(persistedOrder);
        Assert.Equal(_authUserId, persistedOrder.CustomerId);
        Assert.Equal(OrderStatus.Pending, persistedOrder.Status);
        Assert.NotEqual(default, persistedOrder.CreatedAt);

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == _authUserId);
        Assert.NotNull(notification);
        Assert.Equal(response.Id, notification.OrderId);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsUnauthorizedAccessException_WhenNotAuthenticated()
    {
        _currentUserService.UserId = null;
        var command = GetValidCommand();

        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.CreateOrderAsync(command));
        Assert.Equal("You must be authenticated to perform this action.", exception.Message);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenPickupAddressMissing()
    {
        var command = GetValidCommand() with { PickupAddress = "" };
        
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Pickup address is required", exception.Message);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenPickupDateInPast()
    {
        var command = GetValidCommand() with { PreferredPickupDate = DateTime.UtcNow.AddDays(-1).Date };
        
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Preferred pickup date cannot be in the past", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenWeightIsInvalid(decimal weight)
    {
        var command = GetValidCommand() with { WeightKg = weight };
        
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Weight must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenLengthIsInvalid(decimal length)
    {
        var command = GetValidCommand() with { LengthCm = length };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Length must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenWidthIsInvalid(decimal width)
    {
        var command = GetValidCommand() with { WidthCm = width };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Width must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenHeightIsInvalid(decimal height)
    {
        var command = GetValidCommand() with { HeightCm = height };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Height must be greater than zero", exception.Message);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenRecipientContactInvalid()
    {
        var command = GetValidCommand() with { RecipientContact = "12" };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Recipient contact format is invalid", exception.Message);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsArgumentException_WhenPriorityIsInvalid()
    {
        var command = GetValidCommand() with { Priority = "InvalidPriority" };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateOrderAsync(command));
        Assert.Contains("Invalid delivery priority", exception.Message);
    }

    [Fact]
    public async Task GetMyOrdersAsync_ReturnsOnlyOrdersBelongingToAuthenticatedCustomer()
    {
        var otherUserId = Guid.NewGuid();
        
        var order1 = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = _authUserId, PickupCity = "Colombo", DeliveryCity = "Kandy" };
        var order2 = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = otherUserId, PickupCity = "Colombo", DeliveryCity = "Kandy" };
        
        _context.DeliveryOrders.AddRange(order1, order2);
        await _context.SaveChangesAsync();

        var orders = await _service.GetMyOrdersAsync();

        Assert.Single(orders);
        Assert.Equal(order1.Id, orders.First().Id);
    }

    [Fact]
    public async Task GetOrderByIdAsync_CustomerCanRetrieveTheirOwnOrder()
    {
        var order = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = _authUserId, PickupCity = "C", DeliveryCity = "D" };
        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync();

        var result = await _service.GetOrderByIdAsync(order.Id);

        Assert.NotNull(result);
        Assert.Equal(order.Id, result.Id);
    }

    [Fact]
    public async Task GetOrderByIdAsync_CustomerCannotRetrieveAnotherCustomersOrder_ThrowsKeyNotFoundException()
    {
        var otherUserId = Guid.NewGuid();
        var order = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = otherUserId, PickupCity = "C", DeliveryCity = "D" };
        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetOrderByIdAsync(order.Id));
    }

    [Fact]
    public async Task CancelOrderAsync_CustomerCanCancelTheirOwnPendingOrder()
    {
        var order = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = _authUserId, Status = OrderStatus.Pending, PickupCity = "C", DeliveryCity = "D" };
        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync();

        var result = await _service.CancelOrderAsync(order.Id);

        Assert.Equal(OrderStatus.Cancelled.ToString(), result.Status);
        
        var persistedOrder = await _context.DeliveryOrders.SingleAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.Cancelled, persistedOrder.Status);
        Assert.NotNull(persistedOrder.UpdatedAt);
    }

    [Fact]
    public async Task CancelOrderAsync_CustomerCannotCancelAnotherCustomersOrder_ThrowsKeyNotFoundException()
    {
        var otherUserId = Guid.NewGuid();
        var order = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = otherUserId, Status = OrderStatus.Pending, PickupCity = "C", DeliveryCity = "D" };
        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CancelOrderAsync(order.Id));
    }

    [Fact]
    public async Task CancelOrderAsync_ThrowsInvalidOperationException_WhenOrderIsNotPending()
    {
        var order = new DeliveryOrder { Id = Guid.NewGuid(), CustomerId = _authUserId, Status = OrderStatus.Confirmed, PickupCity = "C", DeliveryCity = "D" };
        _context.DeliveryOrders.Add(order);
        await _context.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelOrderAsync(order.Id));
        Assert.Contains("Only Pending orders can be cancelled", exception.Message);
    }
}
