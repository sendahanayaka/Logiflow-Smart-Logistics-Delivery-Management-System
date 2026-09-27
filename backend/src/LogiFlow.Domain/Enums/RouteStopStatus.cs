// [S4]  enum
namespace LogiFlow.Domain.Enums;

/// <summary>Per-stop progress along a dispatched run, updated from the driver app.</summary>
public enum RouteStopStatus
{
    Pending = 0,    // not yet reached
    EnRoute = 1,    // driver departed the previous stop toward this one
    Arrived = 2,    // driver is at the stop
    Delivered = 3,  // package handed over
    Skipped = 4     // could not deliver (customer absent, etc.)
}
