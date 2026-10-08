using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using LogiFlow.Api.DTOs.Orders;
using LogiFlow.Application.Orders.DTOs;
using LogiFlow.IntegrationTests.Delivery;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LogiFlow.IntegrationTests.Orders;

public class OrdersControllerTests : IClassFixture<IntegrationTestFactory>
{
    private readonly IntegrationTestFactory _factory;

    public OrdersControllerTests(IntegrationTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMyOrders_Returns401_WhenNoTokenProvided()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Act
        var response = await client.GetAsync("/api/orders/my-orders");
        
        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListOrders_Returns403_WhenCustomerAttemptsAccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER"));
        
        // Act
        var response = await client.GetAsync("/api/orders");
        
        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrder_Returns400_WhenValidationFails()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER"));
        
        // Invalid request: Missing PickupAddress and negative weight
        var request = new CreateDeliveryOrderRequest(
            PickupAddress: string.Empty,
            PickupCity: "Colombo",
            DeliveryAddress: "456 Dest St",
            DeliveryCity: "Galle",
            PackageDescription: "A box of books",
            SpecialHandling: null,
            PreferredPickupDate: DateTime.UtcNow.AddDays(1).Date,
            PreferredPickupTime: new TimeSpan(10, 0, 0),
            Priority: "Standard",
            WeightKg: -1m,
            LengthCm: 20m,
            WidthCm: 20m,
            HeightCm: 20m,
            RecipientName: "John Doe",
            RecipientContact: "0771234567"
        );
        
        // Act
        var response = await client.PostAsJsonAsync("/api/orders", request);
        
        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var problemDetails = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problemDetails);
        Assert.Contains("PickupAddress", problemDetails!.Errors.Keys);
        Assert.Contains("WeightKg", problemDetails.Errors.Keys);
    }

    [Fact]
    public async Task CreateOrder_SuccessfullyReturns201Created()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER"));
        
        var request = new CreateDeliveryOrderRequest(
            PickupAddress: "123 Valid St",
            PickupCity: "Colombo",
            DeliveryAddress: "456 Dest St",
            DeliveryCity: "Galle",
            PackageDescription: "A box of books",
            SpecialHandling: null,
            PreferredPickupDate: DateTime.UtcNow.AddDays(1).Date,
            PreferredPickupTime: new TimeSpan(10, 0, 0),
            Priority: "Standard",
            WeightKg: 10.5m,
            LengthCm: 20m,
            WidthCm: 20m,
            HeightCm: 20m,
            RecipientName: "John Doe",
            RecipientContact: "0771234567"
        );
        
        // Act
        var response = await client.PostAsJsonAsync("/api/orders", request);
        
        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var order = await response.Content.ReadFromJsonAsync<DeliveryOrderResponse>();
        Assert.NotNull(order);
        Assert.NotEqual(Guid.Empty, order!.Id);
        Assert.Equal("Pending", order.Status);
    }

    [Fact]
    public async Task GetOrderById_Returns404_WhenGivenUnknownId()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER"));
        
        var unknownId = Guid.NewGuid();
        
        // Act
        var response = await client.GetAsync($"/api/orders/{unknownId}");
        
        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetOrderById_Returns404_WhenRequestingAnotherCustomersOrder()
    {
        // Arrange
        var clientCustomerA = _factory.CreateClient();
        clientCustomerA.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER")); // Implicitly Customer A via factory tokens
        
        var clientCustomerB = _factory.CreateClient();
        clientCustomerB.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For("CUSTOMER")); // Explicitly different Customer B payload via randomized token generation
        
        // Customer A Creates an Order
        var createRequest = new CreateDeliveryOrderRequest(
            PickupAddress: "123 Valid St", PickupCity: "Colombo", DeliveryAddress: "456 Dest St", DeliveryCity: "Galle",
            PackageDescription: "A box of books", SpecialHandling: null, PreferredPickupDate: DateTime.UtcNow.AddDays(1).Date,
            PreferredPickupTime: new TimeSpan(10, 0, 0), Priority: "Standard", WeightKg: 10.5m, LengthCm: 20m, WidthCm: 20m, HeightCm: 20m,
            RecipientName: "John Doe", RecipientContact: "0771234567"
        );
        
        var createResponse = await clientCustomerA.PostAsJsonAsync("/api/orders", createRequest);
        var order = await createResponse.Content.ReadFromJsonAsync<DeliveryOrderResponse>();
        
        // Act: Customer B Attempts to Retrieve Customer A's Order
        var retrieveResponse = await clientCustomerB.GetAsync($"/api/orders/{order!.Id}");
        
        // Assert: System obscures presence via 404 (Not Found) per isolated KeyNotFoundException boundaries
        Assert.Equal(HttpStatusCode.NotFound, retrieveResponse.StatusCode);
    }
}
