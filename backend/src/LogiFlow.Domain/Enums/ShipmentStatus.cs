// [S4]  enum
namespace LogiFlow.Domain.Enums;

/// <summary>Lifecycle of a dispatched delivery run (a <c>Shipment</c>).</summary>
public enum ShipmentStatus
{
    Created = 0,     // built from an approved workflow, not yet on the road
    Dispatched = 1,  // handed to the driver
    InTransit = 2,   // at least one stop under way
    Delivered = 3,   // all stops delivered
    Failed = 4,      // aborted / could not complete
    Cancelled = 5
}
