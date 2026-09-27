using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using LogiFlow.Application.Agents;

namespace LogiFlow.Infrastructure.Agents;

/// <summary>
/// Typed client for the internal-only S3 dispatch validation endpoint. The
/// response is descriptive only; callers retain deterministic backend authority.
/// </summary>
public sealed class S3AgentValidationClient : IAgentValidationClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;

    public S3AgentValidationClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<AgentDispatchValidationResult> ValidateDispatchAsync(
        AgentDispatchValidationRequest request,
        CancellationToken cancellationToken = default)
    {
        return await SendValidationAsync(
            new AgentValidationRequestPayload(
                request.WorkflowId,
                new ProposedAllocationPayload(new ProposedVehiclePayload(request.VehicleId, null, null, null), null),
                new BatchCandidatePayload(
                    request.OrderIds.Select(id => id.ToString()).ToArray(),
                    request.VehicleId,
                    request.BatchId.ToString())),
            cancellationToken);
    }

    public async Task<AgentDispatchValidationResult> ValidateCandidateAsync(
        AgentDispatchCandidateValidationRequest request,
        CancellationToken cancellationToken = default)
    {
        return await SendValidationAsync(
            new AgentValidationRequestPayload(
                request.WorkflowId,
                new ProposedAllocationPayload(
                    new ProposedVehiclePayload(
                        request.VehicleId,
                        request.MaxWeightKg,
                        request.MaxVolumeM3,
                        request.DriverId),
                    new CandidatePayload(
                        request.WarehouseId.ToString(),
                        request.PackageIds.Select(id => id.ToString()).ToArray())),
                new BatchCandidatePayload(
                    request.OrderIds.Select(id => id.ToString()).ToArray(),
                    request.VehicleId ?? string.Empty,
                    null)),
            cancellationToken);
    }

    private async Task<AgentDispatchValidationResult> SendValidationAsync(
        AgentValidationRequestPayload payload,
        CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                "validation/dispatch",
                payload,
                JsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new AgentValidationUnavailableException(
                    $"The internal agent service returned HTTP {(int)response.StatusCode}.");
            }

            var result = await response.Content.ReadFromJsonAsync<AgentValidationResultPayload>(
                JsonOptions,
                cancellationToken);

            if (result is null || !IsResult(result.Result) || string.IsNullOrWhiteSpace(result.WorkflowId))
            {
                throw new AgentValidationUnavailableException(
                    "The internal agent service returned an invalid validation response.");
            }

            return new AgentDispatchValidationResult(
                result.WorkflowId,
                result.Result,
                (result.RuleResults ?? Array.Empty<AgentValidationRulePayload>())
                    .Select(rule => new AgentValidationRuleResult(rule.Rule, rule.Passed, rule.Detail))
                    .ToArray(),
                result.Explanation,
                result.ExplanationSource,
                result.RejectionReasons ?? Array.Empty<string>());
        }
        catch (AgentValidationUnavailableException)
        {
            throw;
        }
        catch (Exception exception) when (
            exception is HttpRequestException
            or TaskCanceledException
            or JsonException
            or NotSupportedException)
        {
            throw new AgentValidationUnavailableException(
                "The internal agent explanation service is unavailable.",
                exception);
        }
    }

    private static bool IsResult(string value) => value is "PASS" or "FAIL" or "REVISE";

    private sealed record AgentValidationRequestPayload(
        [property: JsonPropertyName("workflow_id")] string WorkflowId,
        [property: JsonPropertyName("proposed_allocation")] ProposedAllocationPayload ProposedAllocation,
        [property: JsonPropertyName("batch")] BatchCandidatePayload Batch);

    private sealed record ProposedAllocationPayload(
        [property: JsonPropertyName("proposed")] ProposedVehiclePayload Proposed,
        [property: JsonPropertyName("candidate")] CandidatePayload? Candidate);

    private sealed record ProposedVehiclePayload(
        [property: JsonPropertyName("vehicle_id")] string? VehicleId,
        [property: JsonPropertyName("max_weight_kg")] decimal? MaxWeightKg,
        [property: JsonPropertyName("max_volume_m3")] decimal? MaxVolumeM3,
        [property: JsonPropertyName("driver_id")] string? DriverId);

    private sealed record CandidatePayload(
        [property: JsonPropertyName("warehouse_id")] string WarehouseId,
        [property: JsonPropertyName("package_ids")] IReadOnlyCollection<string> PackageIds);

    private sealed record BatchCandidatePayload(
        [property: JsonPropertyName("order_ids")] IReadOnlyCollection<string> OrderIds,
        [property: JsonPropertyName("vehicle_id")] string VehicleId,
        [property: JsonPropertyName("batch_id")] string? BatchId);

    private sealed record AgentValidationResultPayload(
        [property: JsonPropertyName("workflow_id")] string WorkflowId,
        [property: JsonPropertyName("result")] string Result,
        [property: JsonPropertyName("rule_results")] IReadOnlyCollection<AgentValidationRulePayload>? RuleResults,
        [property: JsonPropertyName("explanation")] string? Explanation,
        [property: JsonPropertyName("explanation_source")] string? ExplanationSource,
        [property: JsonPropertyName("rejection_reasons")] IReadOnlyCollection<string>? RejectionReasons);

    private sealed record AgentValidationRulePayload(
        [property: JsonPropertyName("rule")] string Rule,
        [property: JsonPropertyName("passed")] bool Passed,
        [property: JsonPropertyName("detail")] string? Detail);
}
