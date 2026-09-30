using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LogiFlow.Infrastructure.Auth;

public sealed class InternalApiKeyAuthenticationOptions : AuthenticationSchemeOptions
{
}

/// <summary>
/// Authenticates the internal Python agent service by a shared secret sent as
/// <c>X-Internal-Api-Key</c>. A valid key yields a service principal that carries the
/// roles the agent needs to read fleet/warehouse data, so those controllers can be
/// role-locked for humans while the agent still reaches its allow-listed endpoints.
/// Human browsers authenticate with JWT (the Bearer scheme) as before.
/// </summary>
public sealed class InternalApiKeyAuthenticationHandler
    : AuthenticationHandler<InternalApiKeyAuthenticationOptions>
{
    public const string SchemeName = "InternalApiKey";
    public const string HeaderName = "X-Internal-Api-Key";

    private readonly string? _configuredKey;

    public InternalApiKeyAuthenticationHandler(
        IOptionsMonitor<InternalApiKeyAuthenticationOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration configuration)
        : base(options, logger, encoder)
    {
        _configuredKey = configuration["AgentService:ApiKey"];
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // No key header → not our request; let the JWT scheme try.
        if (!Request.Headers.TryGetValue(HeaderName, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (string.IsNullOrWhiteSpace(_configuredKey) || !FixedTimeEquals(provided!, _configuredKey))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid internal API key."));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "agent-service"),
            new Claim(ClaimTypes.Role, "ADMIN"),
            new Claim(ClaimTypes.Role, "WAREHOUSE_STAFF"),
        };
        var ticket = new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName)), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    private static bool FixedTimeEquals(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
}
