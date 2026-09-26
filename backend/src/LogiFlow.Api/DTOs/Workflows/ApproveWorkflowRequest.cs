using System.Collections.Generic;

namespace LogiFlow.Api.DTOs.Workflows;

/// <summary>
/// An ops-manager decision. <see cref="Action"/> is "APPROVE" | "REJECT" | "REVISE".
/// DriverId / VehicleId are required for APPROVE (the allocated driver + vehicle).
/// </summary>
public sealed record ApproveWorkflowRequest(
    string Action,
    string DecidedBy,
    string? Reason,
    Dictionary<string, object>? Revisions,
    Guid? DriverId,
    Guid? VehicleId);
