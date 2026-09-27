using System;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using Xunit;

namespace LogiFlow.UnitTests.Delivery;

public sealed class TimelineBuilderTests
{
    [Fact]
    public void Build_MergesPlannedStopsWithLatestActualEvent()
    {
        var stops = new[]
        {
            new TimelineStop(1, "s1", "Kandy 1", new DateTime(2026, 9, 22, 9, 30, 0), "Delivered"),
            new TimelineStop(2, "s2", "Kandy 2", new DateTime(2026, 9, 22, 9, 55, 0), "Pending"),
        };
        var events = new[]
        {
            new TimelineEvent(1, "ArrivedStop", new DateTime(2026, 9, 22, 9, 32, 0), "arrived"),
            new TimelineEvent(1, "Delivered", new DateTime(2026, 9, 22, 9, 40, 0), "signed"),
        };

        var timeline = TimelineBuilder.Build(stops, events);

        Assert.Equal(2, timeline.Count);
        Assert.Equal(new DateTime(2026, 9, 22, 9, 40, 0), timeline[0].ActualAt); // latest event wins
        Assert.Equal("signed", timeline[0].Note);
        Assert.Null(timeline[1].ActualAt);                                        // stop 2 has no event yet
    }

    [Fact]
    public void Build_OrdersBySequence()
    {
        var stops = new[]
        {
            new TimelineStop(2, "s2", "Kandy 2", new DateTime(2026, 9, 22, 9, 55, 0), "Pending"),
            new TimelineStop(1, "s1", "Kandy 1", new DateTime(2026, 9, 22, 9, 30, 0), "Pending"),
        };

        var timeline = TimelineBuilder.Build(stops, Array.Empty<TimelineEvent>());

        Assert.Equal(1, timeline[0].Sequence);
        Assert.Equal(2, timeline[1].Sequence);
    }
}
