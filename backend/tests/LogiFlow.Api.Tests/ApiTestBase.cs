using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Api.Tests;

public abstract class ApiTestBase
{
    protected ApiTestBase(LogiFlowApiFactory factory)
    {
        Factory = factory;
    }

    protected LogiFlowApiFactory Factory { get; }

    protected async Task<HttpClient> CreateAuthorizedClientAsync(
        UserRole role,
        string? email = null)
    {
        email ??= $"{role.ToString().ToLowerInvariant()}-{Guid.NewGuid():N}@example.com";
        await Factory.CreateUserAsync(email, role);

        var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = LogiFlowApiFactory.DefaultPassword
        });
        response.EnsureSuccessStatusCode();

        var login = await response.Content.ReadFromJsonAsync<TestLoginResponse>(
            ApiJson.Options);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            login!.AccessToken);

        return client;
    }

    protected static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, ApiJson.Options)
            ?? throw new InvalidOperationException(
                $"The API returned no {typeof(T).Name}. Body: {content}");
    }
}
