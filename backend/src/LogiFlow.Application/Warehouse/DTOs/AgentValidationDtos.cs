using LogiFlow.Application.Agents;

namespace LogiFlow.Application.Warehouse.DTOs;

/// <summary>
/// UI-facing response for an internal agent review. DeterministicResult is the
/// backend authority; AgentResult is explanatory/auditable only.
/// </summary>
public sealed record DispatchAgentValidationResponse(
    Guid BatchId,
    string DeterministicResult,
    IReadOnlyCollection<string> DeterministicIssues,
    bool AgentAvailable,
    bool AgentConsistent,
    string? AgentResult,
    IReadOnlyCollection<AgentValidationRuleResult> RuleResults,
    string? Explanation,
    string? ExplanationSource,
    string? AgentMessage);

public sealed record DispatchCandidateAgentValidationResponse(
    string Result,
    bool AgentAvailable,
    IReadOnlyCollection<AgentValidationRuleResult> RuleResults,
    string? Explanation,
    string? ExplanationSource,
    IReadOnlyCollection<string> RejectionReasons,
    string? AgentMessage);
