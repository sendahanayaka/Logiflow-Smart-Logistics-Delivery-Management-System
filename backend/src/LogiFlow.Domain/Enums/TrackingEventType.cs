// [S4]  enum
namespace LogiFlow.Domain.Enums;

/// <summary>
/// Kinds of entry on a shipment's tracking timeline (the S4 non-CRUD deliverable).
/// <see cref="EtaRecalculated"/> records a timeline recompute after a delay event.
/// </summary>
public enum TrackingEventType
{
    Dispatched = 0,
    DepartedStop = 1,
    ArrivedStop = 2,
    Delivered = 3,
    DelayReported = 4,
    EtaRecalculated = 5,
    Exception = 6
}
