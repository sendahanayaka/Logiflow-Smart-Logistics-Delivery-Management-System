// [S4]  Browser-facing passthrough to the internal agent service.
//
// The agent service is internal-only: it sits behind the shared X-Internal-Api-Key
// and must never be called straight from the React/Flutter clients. The S2 "run a
// quick agent simulation" tools (AgenticAIDrawer, MultiOrderTripPanel) still speak
// the agent's native snake_case schema, so rather than reshape them into the
// batch-based /api/workflows contract we forward their requests verbatim here,
// adding the internal key server-side. The browser only ever talks to the backend.
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/agent")]
[Authorize] // any authenticated user; the agent key is added by the named client, not the browser
public class AgentProxyController : ControllerBase
{
    // Named client registered in Program.cs with the agent base address + internal key.
    public const string HttpClientName = "AgentProxy";

    private readonly IHttpClientFactory _httpClientFactory;

    public AgentProxyController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("health")]
    public Task<IActionResult> Health(CancellationToken cancellationToken) =>
        ForwardAsync(HttpMethod.Get, "health", body: null, cancellationToken);

    [HttpPost("workflow/run")]
    public Task<IActionResult> RunWorkflow(
        [FromBody] JsonElement body,
        CancellationToken cancellationToken) =>
        ForwardAsync(HttpMethod.Post, "workflow/run", body, cancellationToken);

    [HttpGet("workflow/{id}")]
    public Task<IActionResult> GetWorkflow(string id, CancellationToken cancellationToken) =>
        ForwardAsync(HttpMethod.Get, $"workflow/{Uri.EscapeDataString(id)}", body: null, cancellationToken);

    [HttpPost("workflow/{id}/approval")]
    public Task<IActionResult> ApproveWorkflow(
        string id,
        [FromBody] JsonElement body,
        CancellationToken cancellationToken) =>
        ForwardAsync(HttpMethod.Post, $"workflow/{Uri.EscapeDataString(id)}/approval", body, cancellationToken);

    // Forwards the call to the agent and relays its status code + JSON body unchanged,
    // so the existing snake_case response contract the frontend expects is preserved.
    private async Task<IActionResult> ForwardAsync(
        HttpMethod method,
        string path,
        JsonElement? body,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(HttpClientName);

        using var request = new HttpRequestMessage(method, path);
        if (body.HasValue)
        {
            request.Content = new StringContent(body.Value.GetRawText(), Encoding.UTF8, "application/json");
        }

        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, cancellationToken);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            // Agent unreachable or timed out (e.g. a Render cold start) — let the UI
            // fall back to its deterministic/offline mode instead of surfacing a 500.
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Agent service is unavailable." });
        }

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        return new ContentResult
        {
            StatusCode = (int)response.StatusCode,
            Content = string.IsNullOrEmpty(payload) ? null : payload,
            ContentType = "application/json",
        };
    }
}
