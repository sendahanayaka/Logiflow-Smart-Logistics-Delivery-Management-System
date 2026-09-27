namespace LogiFlow.Application.Agents;

/// <summary>
/// Boundary for the internal agent service. Implementations must never allow an
/// agent response to mutate dispatch state or override deterministic validation.
/// </summary>
public interface IAgentValidationClient
{
    Task<AgentDispatchValidationResult> ValidateDispatchAsync(
        AgentDispatchValidationRequest request,
        CancellationToken cancellationToken = default);

    Task<AgentDispatchValidationResult> ValidateCandidateAsync(
        AgentDispatchCandidateValidationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record AgentDispatchValidationRequest(
    string WorkflowId,
    string VehicleId,
    Guid BatchId,
    IReadOnlyCollection<Guid> OrderIds);

public sealed record AgentDispatchCandidateValidationRequest(
    string WorkflowId,
    Guid WarehouseId,
    IReadOnlyCollection<Guid> PackageIds,
    IReadOnlyCollection<Guid> OrderIds,
    string? VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    string? DriverId);

public sealed record AgentValidationRuleResult(
    string Rule,
    bool Passed,
    string? Detail);

public sealed record AgentDispatchValidationResult(
    string WorkflowId,
    string Result,
    IReadOnlyCollection<AgentValidationRuleResult> RuleResults,
    string? Explanation,
    string? ExplanationSource,
    IReadOnlyCollection<string> RejectionReasons);

public sealed class AgentValidationUnavailableException : Exception
{
    public AgentValidationUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
