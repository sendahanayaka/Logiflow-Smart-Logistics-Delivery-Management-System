// [S4]  entity
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// One sequenced stop in a routing plan. Distances/ETAs are seeded from the agent's
/// proposal but re-computed and owned by the backend EtaEngine (Phase 3), which is
/// the source of truth once the plan is validated.
/// </summary>
public class RouteStop
{
    public Guid Id { get; set; }
    public Guid AgentWorkflowId { get; set; }

    /// <summary>The agent's <c>stop_id</c> (external correlation key).</summary>
    public string StopKey { get; set; } = string.Empty;

    // TODO(S1): link to DeliveryOrder once S1 publishes its contract.
    public Guid OrderId { get; set; }

    public int Sequence { get; set; }
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public decimal DistanceFromPrevKm { get; set; }

    public DateTime Eta { get; set; }
    public DateTime? WindowStart { get; set; }
    public DateTime? WindowEnd { get; set; }
    public bool? OnTime { get; set; }

    public RouteStopStatus Status { get; set; } = RouteStopStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public AgentWorkflow AgentWorkflow { get; set; } = null!;
}
