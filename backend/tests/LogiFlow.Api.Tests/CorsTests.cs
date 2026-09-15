using System.Net;

namespace LogiFlow.Api.Tests;

[Collection(ApiCollection.Name)]
public sealed class CorsTests : ApiTestBase
{
    private const string AllowedOrigin = "https://allowed.logiflow.test";

    public CorsTests(LogiFlowApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Preflight_FromConfiguredOrigin_AllowsCredentials()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();
        using var request = CreatePreflightRequest(AllowedOrigin);

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(
            AllowedOrigin,
            response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal(
            "true",
            response.Headers.GetValues("Access-Control-Allow-Credentials").Single());
        Assert.Contains(
            "POST",
            response.Headers.GetValues("Access-Control-Allow-Methods"));
    }

    [Fact]
    public async Task Preflight_FromUnknownOrigin_DoesNotGrantCorsAccess()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();
        using var request = CreatePreflightRequest("https://unknown.example");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.False(response.Headers.Contains("Access-Control-Allow-Credentials"));
    }

    private static HttpRequestMessage CreatePreflightRequest(string origin)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Options,
            "/api/auth/refresh");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");
        return request;
    }
}
