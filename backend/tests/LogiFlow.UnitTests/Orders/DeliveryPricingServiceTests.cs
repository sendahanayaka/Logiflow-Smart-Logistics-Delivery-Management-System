using FluentAssertions;
using LogiFlow.Application.Orders;
using LogiFlow.Domain.Entities;
using Xunit;

namespace LogiFlow.UnitTests.Orders;

public class DeliveryPricingServiceTests
{
    private readonly DeliveryPricingService _sut;

    public DeliveryPricingServiceTests()
    {
        _sut = new DeliveryPricingService();
    }

    [Fact]
    public void CalculateFee_WithStandardPriorityAndNoHandling_ShouldMatchExpectedFormula()
    {
        // Arrange
        var order = new DeliveryOrder
        {
            WeightKg = 10,
            LengthCm = 100,
            WidthCm = 100,
            HeightCm = 10, // Vol = 0.1 m3
            Priority = LogiFlow.Domain.Enums.DeliveryPriority.Standard
        };

        decimal distanceKm = 12m;

        // Act
        var result = _sut.CalculateFee(order, "None", distanceKm);

        // Assert
        // Base = 300
        // Distance = 12 * 50 = 600
        // Weight = 10 * 20 = 200
        // Volume = 0.1 * 500 = 50
        // Handling = 0
        // Priority = 0
        // Total = 300+600+200+50 = 1150
        result.BaseFee.Should().Be(300m);
        result.DistanceCharge.Should().Be(600m);
        result.WeightCharge.Should().Be(200m);
        result.VolumeCharge.Should().Be(50m);
        result.HandlingCharge.Should().Be(0m);
        result.PriorityCharge.Should().Be(0m);
        result.TotalDeliveryFee.Should().Be(1150m);
    }

    [Fact]
    public void CalculateFee_WithHighPriorityAndFragileHandling_ShouldIncludePremiumCharges()
    {
        // Arrange
        var order = new DeliveryOrder
        {
            WeightKg = 5,
            LengthCm = 50,
            WidthCm = 50,
            HeightCm = 40, // Vol = 0.1 m3
            Priority = LogiFlow.Domain.Enums.DeliveryPriority.Express
        };

        decimal distanceKm = 10m;

        // Act
        var result = _sut.CalculateFee(order, "Fragile", distanceKm);

        // Assert
        // Base = 300
        // Distance = 10 * 50 = 500
        // Weight = 5 * 20 = 100
        // Volume = 0.1 * 500 = 50
        // Handling = Fragile = 200
        // Priority = 250
        // Total = 300+500+100+50+200+250 = 1400
        result.PriorityCharge.Should().Be(250m);
        result.HandlingCharge.Should().Be(200m);
        result.TotalDeliveryFee.Should().Be(1400m);
    }

    [Theory]
    [InlineData("Temperature Sensitive", 400)]
    [InlineData("Oversized", 500)]
    [InlineData("Unknown", 0)]
    public void CalculateFee_ShouldMapHandlingRequirementsCorrectly(string handling, decimal expectedCharge)
    {
        // Arrange
        var order = new DeliveryOrder { WeightKg = 1, LengthCm = 10, WidthCm = 10, HeightCm = 10 };
        
        // Act
        var result = _sut.CalculateFee(order, handling, 1m);

        // Assert
        result.HandlingCharge.Should().Be(expectedCharge);
    }
}
