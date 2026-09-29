using LogiFlow.Application.Agents;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Api.DTOs.Warehouse;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

/// <summary>
/// Public application boundary for the internal S3 agent. The browser calls this
/// controller only; it never receives the agent service URL or credentials.
/// </summary>
[ApiController]
[Route("api/dispatch")]
public sealed class DispatchAgentValidationController : ControllerBase
{
    private readonly IDispatchBatchService _dispatchBatchService;
    private readonly IAgentValidationClient _agentValidationClient;

    public DispatchAgentValidationController(
        IDispatchBatchService dispatchBatchService,
        IAgentValidationClient agentValidationClient)
    {
        _dispatchBatchService = dispatchBatchService;
        _agentValidationClient = agentValidationClient;
    }

    [HttpPost("batches/{id:guid}/agent-validation")]
    [ProducesResponseType(typeof(DispatchAgentValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DispatchAgentValidationResponse>> ValidateWithAgent(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            // This is the authoritative decision exposed even when the optional
            // explanation service is offline or returns malformed data.
            var deterministic = await _dispatchBatchService.GetValidationAsync(id, cancellationToken);
            var context = await _dispatchBatchService.GetValidationContextAsync(id, cancellationToken);
            var request = new AgentDispatchValidationRequest(
                $"s3-dispatch-validation-{id:N}",
                context.VehicleId,
                id,
                context.Packages.Select(package => package.OrderId).ToArray());

            try
            {
                var agent = await _agentValidationClient.ValidateDispatchAsync(request, cancellationToken);
                var consistent = string.Equals(agent.Result, deterministic.Result, StringComparison.Ordinal);

                return Ok(new DispatchAgentValidationResponse(
                    id,
                    deterministic.Result,
                    deterministic.Issues,
                    AgentAvailable: true,
                    AgentConsistent: consistent,
                    AgentResult: agent.Result,
                    RuleResults: consistent ? agent.RuleResults : Array.Empty<AgentValidationRuleResult>(),
                    Explanation: consistent ? agent.Explanation : null,
                    ExplanationSource: consistent ? agent.ExplanationSource : null,
                    AgentMessage: consistent
                        ? null
                        : "The internal agent result did not match deterministic backend validation. Its explanation was withheld."));
            }
            catch (AgentValidationUnavailableException)
            {
                return Ok(new DispatchAgentValidationResponse(
                    id,
                    deterministic.Result,
                    deterministic.Issues,
                    AgentAvailable: false,
                    AgentConsistent: false,
                    AgentResult: null,
                    RuleResults: Array.Empty<AgentValidationRuleResult>(),
                    Explanation: null,
                    ExplanationSource: null,
                    AgentMessage: "The deterministic backend result is available, but the internal agent explanation service is currently unavailable."));
            }
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("validate-candidate")]
    [ProducesResponseType(typeof(DispatchCandidateAgentValidationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DispatchCandidateAgentValidationResponse>> ValidateCandidate(
        [FromBody] ValidateDispatchCandidateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var agent = await _agentValidationClient.ValidateCandidateAsync(
                new AgentDispatchCandidateValidationRequest(
                    $"s3-candidate-validation-{Guid.NewGuid():N}",
                    request.WarehouseId,
                    request.PackageIds ?? Array.Empty<Guid>(),
                    request.OrderIds ?? Array.Empty<Guid>(),
                    request.VehicleId,
                    request.MaxWeightKg,
                    request.MaxVolumeM3,
                    request.DriverId),
                cancellationToken);

            return Ok(new DispatchCandidateAgentValidationResponse(
                agent.Result,
                AgentAvailable: true,
                agent.RuleResults,
                agent.Explanation,
                agent.ExplanationSource,
                agent.RejectionReasons,
                AgentMessage: null));
        }
        catch (AgentValidationUnavailableException)
        {
            // A network failure prevents deterministic agent tools from running;
            // fail closed and do not allow the UI to create a batch.
            return Ok(new DispatchCandidateAgentValidationResponse(
                "FAIL",
                AgentAvailable: false,
                Array.Empty<AgentValidationRuleResult>(),
                Explanation: null,
                ExplanationSource: null,
                new[] { "The S3 validation service is unavailable; the candidate was not approved." },
                AgentMessage: "The internal S3 validation service is unavailable."));
        }
    }
}
