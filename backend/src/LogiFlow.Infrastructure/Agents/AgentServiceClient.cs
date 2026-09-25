// [S4]  HTTP client to internal agent-service
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using LogiFlow.Application.Workflows;
using LogiFlow.Application.Workflows.DTOs;

namespace LogiFlow.Infrastructure.Agents;

/// <summary>
/// Typed HttpClient for the internal Python agent service. Base address, timeout and
/// the optional X-Internal-Api-Key header are configured at registration (Program.cs).
/// Any transport error or non-success response becomes an <see cref="AgentServiceException"/>.
/// </summary>
public class AgentServiceClient : IAgentServiceClient
{
    // The agent speaks snake_case JSON (workflow_id, stop_id, ...).
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;

    public AgentServiceClient(HttpClient http)
    {
        _http = http;
    }

    public Task<AgentRunResponse> RunAsync(AgentRunPayload payload, CancellationToken cancellationToken = default) =>
        PostAsync<AgentRunRequest, AgentRunResponse>("workflow/run", new AgentRunRequest(payload), cancellationToken);

    public Task<AgentApprovalResponse> ApproveAsync(
        string workflowKey,
        AgentApprovalRequest request,
        CancellationToken cancellationToken = default) =>
        PostAsync<AgentApprovalRequest, AgentApprovalResponse>(
            $"workflow/{Uri.EscapeDataString(workflowKey)}/approval",
            request,
            cancellationToken);

    private async Task<TResponse> PostAsync<TRequest, TResponse>(
        string path,
        TRequest body,
        CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsJsonAsync(path, body, JsonOptions, cancellationToken);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            throw new AgentServiceException(
                $"Agent service unreachable at '{_http.BaseAddress}{path}': {exception.Message}",
                statusCode: null,
                innerException: exception);
        }

        if (!response.IsSuccessStatusCode)
        {
            var detail = await SafeReadBodyAsync(response, cancellationToken);
            throw new AgentServiceException(
                $"Agent service returned {(int)response.StatusCode} for '{path}': {detail}",
                (int)response.StatusCode);
        }

        var value = await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions, cancellationToken);
        if (value is null)
        {
            throw new AgentServiceException(
                $"Agent service returned an empty body for '{path}'.",
                (int)response.StatusCode);
        }

        return value;
    }

    private static async Task<string> SafeReadBodyAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        try
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return body.Length > 500 ? body[..500] : body;
        }
        catch
        {
            return "(no body)";
        }
    }
}
