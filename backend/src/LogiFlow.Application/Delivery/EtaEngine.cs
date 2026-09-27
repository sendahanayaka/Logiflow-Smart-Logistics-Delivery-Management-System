// [S4]  ETA computation engine (non-CRUD)
using LogiFlow.Application.Delivery.DTOs;

namespace LogiFlow.Application.Delivery;

/// <summary>
/// The S4 ETA computation engine — a pure, deterministic C# mirror of the Python
/// agent's eta_calculator. It stamps per-stop ETAs from leg durations and flags
/// window feasibility. Because it is a pure function of its inputs, the same call
/// doubles as the tracking-timeline recompute: a delay is a re-call with a later
/// start time, which shifts every downstream ETA (no stored state to mutate).
///
/// It also re-validates an agent plan server-side: "the LLM orchestrates and explains;
/// deterministic code decides" applies on the backend too — the agent proposes, this
/// engine re-checks the numbers against physics and the delivery windows.
/// </summary>
public static class EtaEngine
{
    public const double DefaultAvgSpeedKmh = 40.0;
    private const double EarthRadiusKm = 6371.0;

    /// <summary>
    /// ETA(i) = start + Σ legDurations[0..i] + i * service. Mirror of the Python engine.
    /// </summary>
    /// <exception cref="ArgumentException">leg count != stop count.</exception>
    public static IReadOnlyList<StopEta> ComputeFromLegDurations(
        IReadOnlyList<EtaStop> stops,
        IReadOnlyList<double> legDurationsMin,
        DateTime startTime,
        double serviceMinutes = 0.0)
    {
        if (legDurationsMin.Count != stops.Count)
        {
            throw new ArgumentException(
                $"legDurationsMin has {legDurationsMin.Count} entries but there are {stops.Count} stop(s).",
                nameof(legDurationsMin));
        }

        var origin = AsUtc(startTime);
        var result = new List<StopEta>(stops.Count);
        var cumulative = 0.0;
        for (var i = 0; i < stops.Count; i++)
        {
            cumulative += legDurationsMin[i] + (i > 0 ? serviceMinutes : 0.0);
            var eta = origin.AddMinutes(cumulative);
            result.Add(new StopEta(
                stops[i].StopKey,
                eta,
                Math.Round(cumulative, 2),
                WithinWindow(eta, stops[i].WindowStart, stops[i].WindowEnd)));
        }

        return result;
    }

    /// <summary>Convenience: derive leg durations from distance + average speed, then compute.</summary>
    public static IReadOnlyList<StopEta> ComputeFromDistances(
        IReadOnlyList<EtaStop> stops,
        DateTime startTime,
        double avgSpeedKmh = DefaultAvgSpeedKmh,
        double serviceMinutes = 0.0)
    {
        var speed = avgSpeedKmh > 0 ? avgSpeedKmh : DefaultAvgSpeedKmh;
        var legs = stops.Select(stop => stop.DistanceFromPrevKm / speed * 60.0).ToList();
        return ComputeFromLegDurations(stops, legs, startTime, serviceMinutes);
    }

    /// <summary>Window feasibility: true only when start ≤ ETA ≤ end; null when no end is set.</summary>
    public static bool? WithinWindow(DateTime eta, DateTime? windowStart, DateTime? windowEnd)
    {
        if (windowEnd is null)
        {
            return null;
        }

        var arrival = AsUtc(eta);
        if (windowStart is not null && arrival < AsUtc(windowStart.Value))
        {
            return false; // too early — the customer window has not opened yet
        }

        return arrival <= AsUtc(windowEnd.Value);
    }

    /// <summary>
    /// Re-validate an agent-proposed plan against physics and the delivery windows.
    /// Hard issues (impossible or inconsistent numbers) set Ok = false; window misses
    /// are warnings for the approval screen.
    /// </summary>
    public static PlanValidation ValidatePlan(IReadOnlyList<EtaStop> stops, IReadOnlyList<DateTime> etas)
    {
        var issues = new List<string>();
        var warnings = new List<string>();

        if (etas.Count != stops.Count)
        {
            issues.Add($"ETA count ({etas.Count}) does not match stop count ({stops.Count}).");
            return new PlanValidation(false, issues, warnings);
        }

        for (var i = 0; i < stops.Count; i++)
        {
            var label = $"stop {i + 1} ({stops[i].StopKey})";

            if (stops[i].DistanceFromPrevKm < 0)
            {
                issues.Add($"{label} has a negative leg distance.");
            }

            if (i > 0)
            {
                if (AsUtc(etas[i]) < AsUtc(etas[i - 1]))
                {
                    issues.Add($"{label} ETA is earlier than the previous stop (non-monotonic).");
                }

                // Road distance can never be shorter than the straight-line distance.
                var straightLine = HaversineKm(
                    stops[i - 1].Latitude, stops[i - 1].Longitude,
                    stops[i].Latitude, stops[i].Longitude);
                if (stops[i].DistanceFromPrevKm + 0.05 < straightLine)
                {
                    issues.Add(
                        $"{label} leg distance {stops[i].DistanceFromPrevKm:0.###} km is below the " +
                        $"straight-line minimum {straightLine:0.###} km (physically impossible).");
                }
            }

            if (WithinWindow(etas[i], stops[i].WindowStart, stops[i].WindowEnd) == false)
            {
                warnings.Add($"{label} ETA {etas[i]:u} falls outside its delivery window.");
            }
        }

        return new PlanValidation(issues.Count == 0, issues, warnings);
    }

    /// <summary>Great-circle distance in km between two lat/lng points.</summary>
    public static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        static double ToRad(double degrees) => degrees * Math.PI / 180.0;

        var dPhi = ToRad(lat2 - lat1);
        var dLambda = ToRad(lng2 - lng1);
        var a = Math.Sin(dPhi / 2) * Math.Sin(dPhi / 2)
                + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) * Math.Sin(dLambda / 2) * Math.Sin(dLambda / 2);
        return 2 * EarthRadiusKm * Math.Asin(Math.Min(1.0, Math.Sqrt(a)));
    }

    private static DateTime AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
