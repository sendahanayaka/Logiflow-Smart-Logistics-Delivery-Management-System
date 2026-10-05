using System;
using System.Linq;
using LogiFlow.Application.Orders;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Xunit;

namespace LogiFlow.UnitTests.Orders;

public class OrderIntelligenceServiceTests
{
    private readonly OrderIntelligenceService _sut = new();

    private DeliveryOrder CreateOrder(
        decimal w, decimal l, decimal wd, decimal h, string sh = null, string desc = "Test", string pkAddr = "A", string pkCity = "C", string delAddr = "B", string delCity = "D")
    {
        return new DeliveryOrder
        {
            WeightKg = w,
            LengthCm = l,
            WidthCm = wd,
            HeightCm = h,
            SpecialHandling = sh,
            PackageDescription = desc,
            Priority = DeliveryPriority.Standard,
            PickupAddress = pkAddr,
            PickupCity = pkCity,
            DeliveryAddress = delAddr,
            DeliveryCity = delCity,
            PreferredPickupDate = DateTime.UtcNow.AddDays(1)
        };
    }

    [Fact]
    public void Analyze_CalculatesVolumeM3_Correctly()
    {
        var result = _sut.Analyze(CreateOrder(10, 100, 40, 30));
        Assert.Equal(0.12m, result.VolumeM3);
    }

    [Theory]
    [InlineData(4.9, "Light")]
    [InlineData(5.0, "Medium")]
    [InlineData(19.9, "Medium")]
    [InlineData(20.0, "Heavy")]
    [InlineData(49.9, "Heavy")]
    [InlineData(50.0, "Very Heavy")]
    public void Analyze_Assigns_WeightClassification(decimal weight, string expected)
    {
        var result = _sut.Analyze(CreateOrder(weight, 10, 10, 10));
        Assert.Equal(expected, result.WeightClassification);
    }

    [Theory]
    [InlineData(null, "Test desc", "None")]
    [InlineData("", "test glass items", "Fragile")] // Derived from description
    [InlineData("Some handling", "Test desc", "Some handling")] // Custom handling is preserved
    [InlineData("Requires temperature control", "Food", "Temperature Sensitive")]
    [InlineData(null, "Cold medicine temp", "Temperature Sensitive")]
    [InlineData("fragile items", "test", "Fragile")]
    [InlineData("oversized package", "test", "Oversized")]
    public void Analyze_Assigns_HandlingRequirement(string specialHandling, string description, string expected)
    {
        var result = _sut.Analyze(CreateOrder(10, 10, 10, 10, specialHandling, description));
        Assert.Equal(expected, result.HandlingRequirement);
    }

    [Fact]
    public void Analyze_Preserves_PriorityRecommendation()
    {
        var order = CreateOrder(10, 10, 10, 10);
        order.Priority = DeliveryPriority.Express;
        var result = _sut.Analyze(order);
        Assert.Equal("Express", result.RecommendedPriority);
    }

    [Fact]
    public void Analyze_DetectsRisks_ForMissingAddresses()
    {
        var order = CreateOrder(10, 10, 10, 10, pkAddr: "", delCity: null);
        var result = _sut.Analyze(order);
        Assert.Contains("Pickup address is missing.", result.RisksOrAmbiguities);
        Assert.Contains("Delivery city is missing.", result.RisksOrAmbiguities);
        Assert.DoesNotContain("Delivery address is missing.", result.RisksOrAmbiguities); // Provided
    }

    [Fact]
    public void Analyze_DetectsRisks_ForInvalidDimensions()
    {
        var result = _sut.Analyze(CreateOrder(0, 10, 10, 10));
        Assert.Contains("Package weight must be greater than zero.", result.RisksOrAmbiguities);
        
        var result2 = _sut.Analyze(CreateOrder(10, 0, 10, 10));
        Assert.Contains("Package dimensions must be greater than zero.", result2.RisksOrAmbiguities);
    }

    [Fact]
    public void Analyze_DetectsRisks_ForManualReviewHandling()
    {
        var result = _sut.Analyze(CreateOrder(10, 10, 10, 10, sh: "Handle with extremely special care"));
        Assert.Contains("Special handling information may require manual review.", result.RisksOrAmbiguities);
    }

    [Fact]
    public void Analyze_CompleteIntelligenceResult()
    {
        var order = CreateOrder(12, 100, 40, 30, sh: "Fragile");
        var result = _sut.Analyze(order);
        
        Assert.Equal(0.12m, result.VolumeM3);
        Assert.Equal("Medium", result.WeightClassification);
        Assert.Equal("Fragile", result.HandlingRequirement);
        Assert.Equal("Standard", result.RecommendedPriority);
        Assert.Empty(result.RisksOrAmbiguities);
    }
}
