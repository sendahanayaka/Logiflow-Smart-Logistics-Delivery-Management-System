namespace LogiFlow.Application.Delivery.DTOs;

/// <summary>One ordered stop entering the ETA engine.</summary>
public sealed record EtaStop(
    string StopKey,
    double Latitude,
    double Longitude,
    double DistanceFromPrevKm,
    DateTime? WindowStart,
    DateTime? WindowEnd);

/// <summary>A stop stamped with its computed ETA.</summary>
public sealed record StopEta(
    string StopKey,
    DateTime Eta,
    double CumulativeMinutes,
    bool? OnTime);

/// <summary>
/// Result of server-side re-validation. Hard <see cref="Issues"/> mean the plan is
/// physically/logically impossible (Ok = false); <see cref="Warnings"/> are feasibility
/// notes (e.g. a stop outside its window) that an ops manager should see but that don't
/// invalidate the data.
/// </summary>
public sealed record PlanValidation(bool Ok, IReadOnlyList<string> Issues, IReadOnlyList<string> Warnings);

/// <summary>A planned stop feeding the tracking timeline.</summary>
public sealed record TimelineStop(
    int Sequence,
    string StopKey,
    string Address,
    DateTime PlannedEta,
    string Status);

/// <summary>An actual tracking event recorded against a run.</summary>
public sealed record TimelineEvent(
    int? Sequence,
    string EventType,
    DateTime OccurredAt,
    string? Note);

/// <summary>One row of the customer/driver tracking timeline (planned + actual).</summary>
public sealed record TimelineEntry(
    int Sequence,
    string StopKey,
    string Address,
    DateTime PlannedEta,
    string Status,
    DateTime? ActualAt,
    string? Note);
