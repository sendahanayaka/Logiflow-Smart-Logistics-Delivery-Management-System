using System;
using System.Linq;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using Xunit;

namespace LogiFlow.UnitTests.Delivery;

public sealed class EtaEngineTests
{
    private static readonly DateTime Start = new(2026, 9, 22, 9, 0, 0);

    private static EtaStop Stop(
        string key, double distanceKm, DateTime? windowStart = null, DateTime? windowEnd = null,
        double lat = 0, double lng = 0) =>
        new(key, lat, lng, distanceKm, windowStart, windowEnd);

    // --- cumulative maths (mirror of the Python engine) -----------------------

    [Fact]
    public void ComputeFromLegDurations_CumulativeNoService()
    {
        var etas = EtaEngine.ComputeFromLegDurations(
            new[] { Stop("a", 0), Stop("b", 0) }, new[] { 30.0, 25.0 }, Start);

        Assert.Equal(new DateTime(2026, 9, 22, 9, 30, 0), etas[0].Eta);
        Assert.Equal(new DateTime(2026, 9, 22, 9, 55, 0), etas[1].Eta);
        Assert.Equal(30, etas[0].CumulativeMinutes);
        Assert.Equal(55, etas[1].CumulativeMinutes);
    }

    [Fact]
    public void ComputeFromLegDurations_ServiceTimeAddedBetweenStops()
    {
        var etas = EtaEngine.ComputeFromLegDurations(
            new[] { Stop("a", 0), Stop("b", 0) }, new[] { 30.0, 25.0 }, Start, serviceMinutes: 10);

        Assert.Equal(new DateTime(2026, 9, 22, 9, 30, 0), etas[0].Eta);   // no service before the first stop
        Assert.Equal(new DateTime(2026, 9, 22, 10, 5, 0), etas[1].Eta);   // 30 + 25 + 10
    }

    [Fact]
    public void ComputeFromLegDurations_LegCountMismatch_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            EtaEngine.ComputeFromLegDurations(new[] { Stop("a", 0) }, new[] { 30.0, 25.0 }, Start));
    }

    [Fact]
    public void ComputeFromDistances_DerivesLegsFromSpeed()
    {
        var etas = EtaEngine.ComputeFromDistances(new[] { Stop("a", 20) }, Start, avgSpeedKmh: 40);
        Assert.Equal(new DateTime(2026, 9, 22, 9, 30, 0), etas[0].Eta); // 20 km / 40 kmh = 30 min
    }

    // --- window feasibility ---------------------------------------------------

    [Fact]
    public void WithinWindow_HonoursBothBounds()
    {
        var eta = new DateTime(2026, 9, 22, 9, 30, 0);
        Assert.True(EtaEngine.WithinWindow(eta, null, new DateTime(2026, 9, 22, 10, 0, 0)));       // in
        Assert.False(EtaEngine.WithinWindow(eta, null, new DateTime(2026, 9, 22, 9, 0, 0))!.Value); // late
        Assert.False(EtaEngine.WithinWindow(eta,
            new DateTime(2026, 9, 22, 14, 0, 0), new DateTime(2026, 9, 22, 17, 0, 0))!.Value);       // too early
        Assert.Null(EtaEngine.WithinWindow(eta, null, null));                                        // no window
    }

    // --- the recompute (delay event) — mirror of the Python test --------------

    [Fact]
    public void Recompute_LateStart_ShiftsDownstream()
    {
        var stops = new[] { Stop("a", 0), Stop("b", 0) };
        var legs = new[] { 30.0, 25.0 };

        var onTime = TimelineBuilder.Recompute(stops, legs, Start);
        var delayed = TimelineBuilder.Recompute(stops, legs, Start.AddMinutes(15)); // left 15m late

        Assert.Equal(new DateTime(2026, 9, 22, 9, 55, 0), onTime[1].Eta);
        Assert.Equal(new DateTime(2026, 9, 22, 10, 10, 0), delayed[1].Eta); // every downstream ETA +15m
    }

    // --- server-side re-validation --------------------------------------------

    [Fact]
    public void ValidatePlan_GoodPlan_IsOk()
    {
        // (0,0)->(0,1) is ~111 km; the 150 km road leg is plausible.
        var stops = new[] { Stop("a", 0, lat: 0, lng: 0), Stop("b", 150, lat: 0, lng: 1) };
        var etas = new[] { new DateTime(2026, 9, 22, 9, 0, 0), new DateTime(2026, 9, 22, 11, 0, 0) };

        var result = EtaEngine.ValidatePlan(stops, etas);

        Assert.True(result.Ok);
        Assert.Empty(result.Issues);
    }

    [Fact]
    public void ValidatePlan_ImpossibleDistance_Fails()
    {
        // 50 km road leg between points ~111 km apart is physically impossible.
        var stops = new[] { Stop("a", 0, lat: 0, lng: 0), Stop("b", 50, lat: 0, lng: 1) };
        var etas = new[] { new DateTime(2026, 9, 22, 9, 0, 0), new DateTime(2026, 9, 22, 11, 0, 0) };

        var result = EtaEngine.ValidatePlan(stops, etas);

        Assert.False(result.Ok);
        Assert.Contains(result.Issues, issue => issue.Contains("straight-line"));
    }

    [Fact]
    public void ValidatePlan_NonMonotonicEtas_Fails()
    {
        var stops = new[] { Stop("a", 0, lat: 0, lng: 0), Stop("b", 150, lat: 0, lng: 1) };
        var etas = new[] { new DateTime(2026, 9, 22, 11, 0, 0), new DateTime(2026, 9, 22, 9, 0, 0) };

        var result = EtaEngine.ValidatePlan(stops, etas);

        Assert.False(result.Ok);
        Assert.Contains(result.Issues, issue => issue.Contains("non-monotonic"));
    }

    [Fact]
    public void ValidatePlan_WindowMiss_IsWarningNotIssue()
    {
        var stops = new[]
        {
            Stop("a", 0, windowStart: new DateTime(2026, 9, 22, 9, 0, 0),
                 windowEnd: new DateTime(2026, 9, 22, 9, 30, 0))
        };
        var etas = new[] { new DateTime(2026, 9, 22, 10, 0, 0) }; // 30 min late

        var result = EtaEngine.ValidatePlan(stops, etas);

        Assert.True(result.Ok);              // a window miss is not a data error
        Assert.NotEmpty(result.Warnings);    // but it is surfaced
    }
}
