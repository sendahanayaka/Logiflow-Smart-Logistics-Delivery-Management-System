// [S4]  tracking timeline generator (non-CRUD)
using LogiFlow.Application.Delivery.DTOs;

namespace LogiFlow.Application.Delivery;

/// <summary>
/// Builds the customer/driver tracking timeline (planned stops merged with actual
/// events) and recomputes downstream ETAs after a delay. The recompute is deliberately
/// just a re-run of <see cref="EtaEngine"/> from a later start time — the same pure
/// function — so a delay shifts every remaining ETA with no stored state to mutate.
/// </summary>
public static class TimelineBuilder
{
    /// <summary>
    /// Merge planned stops with the latest actual event per stop into an ordered timeline.
    /// </summary>
    public static IReadOnlyList<TimelineEntry> Build(
        IReadOnlyList<TimelineStop> stops,
        IReadOnlyList<TimelineEvent> events)
    {
        var latestBySequence = events
            .Where(evt => evt.Sequence is not null)
            .GroupBy(evt => evt.Sequence!.Value)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(e => e.OccurredAt).First());

        return stops
            .OrderBy(stop => stop.Sequence)
            .Select(stop =>
            {
                latestBySequence.TryGetValue(stop.Sequence, out var actual);
                return new TimelineEntry(
                    stop.Sequence,
                    stop.StopKey,
                    stop.Address,
                    stop.PlannedEta,
                    stop.Status,
                    actual?.OccurredAt,
                    actual?.Note);
            })
            .ToList();
    }

    /// <summary>
    /// Recompute ETAs after a delay by re-running the ETA engine from a later start.
    /// Every downstream ETA shifts; this is the tracking-timeline recompute.
    /// </summary>
    public static IReadOnlyList<StopEta> Recompute(
        IReadOnlyList<EtaStop> stops,
        IReadOnlyList<double> legDurationsMin,
        DateTime newStartTime,
        double serviceMinutes = 0.0) =>
        EtaEngine.ComputeFromLegDurations(stops, legDurationsMin, newStartTime, serviceMinutes);
}
