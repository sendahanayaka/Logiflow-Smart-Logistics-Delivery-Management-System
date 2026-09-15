using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Identity;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LogiFlow.Api.Tests;

[Collection(ApiCollection.Name)]
public sealed class AuthEndpointsTests : ApiTestBase
{
    private const string RefreshCookieName = "logiflow.refresh";

    public AuthEndpointsTests(LogiFlowApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Register_WithValidDetails_CreatesActiveUser()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();

        var response = await RegisterAsync(client, "new.customer@example.com");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await ReadJsonAsync<TestUserResponse>(response);
        Assert.Equal("new.customer@example.com", user.Email);
        Assert.Equal("Active", user.Status);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();
        await RegisterAsync(client, "duplicate@example.com");

        var response = await RegisterAsync(client, "duplicate@example.com");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_AlwaysAssignsCustomerRole()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            FullName = "Role Check User",
            Email = "role.check@example.com",
            PhoneNumber = "+94771112233",
            Password = "Test123!",
            ConfirmPassword = "Test123!",
            Role = "OperationsManager"
        });

        var user = await ReadJsonAsync<TestUserResponse>(response);
        Assert.Equal(UserRole.Customer.ToString(), user.Role);
    }

    [Theory]
    [InlineData("lowercase1!", "uppercase")]
    [InlineData("UPPERCASE1!", "lowercase")]
    [InlineData("NoNumber!", "number")]
    [InlineData("NoSpecial1", "special character")]
    [InlineData("Aa1!xyz", "8 characters")]
    public async Task Register_WithPasswordOutsidePolicy_ReturnsBadRequest(
        string password,
        string expectedMessage)
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();

        var response = await RegisterAsync(
            client,
            $"password-{Guid.NewGuid():N}@example.com",
            password);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(
            expectedMessage.ToLowerInvariant(),
            body.ToLowerInvariant());
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsAccessTokenAndUser()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();
        await RegisterAsync(client, "login@example.com");

        var response = await LoginAsync(client, "login@example.com", "Test123!");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await ReadJsonAsync<TestLoginResponse>(response);
        Assert.False(string.IsNullOrWhiteSpace(login.AccessToken));
        Assert.Equal("login@example.com", login.User.Email);
        Assert.True(login.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Login_SetsSecureHttpOnlyRefreshCookieWithoutExposingTokenInJson()
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, "cookie.login@example.com");

        var response = await LoginAsync(
            client,
            "cookie.login@example.com",
            LogiFlowApiFactory.DefaultPassword);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var setCookie = GetRefreshCookieHeader(response);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("httponly", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/api/auth", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("refreshToken", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_PersistsOnlySha256HashOfRefreshToken()
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, "hashed.refresh@example.com");

        var response = await LoginAsync(
            client,
            "hashed.refresh@example.com",
            LogiFlowApiFactory.DefaultPassword);
        var rawToken = GetRefreshToken(response);

        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var session = await dbContext.RefreshTokenSessions
            .AsNoTracking()
            .SingleAsync();

        Assert.NotEqual(rawToken, session.TokenHash);
        Assert.Equal(HashToken(rawToken), session.TokenHash);
        Assert.Equal(64, session.TokenHash.Length);
    }

    [Fact]
    public async Task Refresh_WithValidCookie_RotatesSessionAndReturnsNewAccessToken()
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, "rotate.refresh@example.com");
        var loginResponse = await LoginAsync(
            client,
            "rotate.refresh@example.com",
            LogiFlowApiFactory.DefaultPassword);
        var oldToken = GetRefreshToken(loginResponse);

        var refreshResponse = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            oldToken);

        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        var refreshed = await ReadJsonAsync<TestLoginResponse>(refreshResponse);
        var newToken = GetRefreshToken(refreshResponse);
        Assert.False(string.IsNullOrWhiteSpace(refreshed.AccessToken));
        Assert.NotEqual(oldToken, newToken);

        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var oldSession = await dbContext.RefreshTokenSessions
            .AsNoTracking()
            .SingleAsync(session => session.TokenHash == HashToken(oldToken));
        var newSession = await dbContext.RefreshTokenSessions
            .AsNoTracking()
            .SingleAsync(session => session.TokenHash == HashToken(newToken));
        Assert.NotNull(oldSession.RevokedAt);
        Assert.Equal(newSession.Id, oldSession.ReplacedByTokenId);
    }

    [Fact]
    public async Task Refresh_WhenRotatedTokenIsReused_ReturnsUnauthorized()
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, "reused.refresh@example.com");
        var loginResponse = await LoginAsync(
            client,
            "reused.refresh@example.com",
            LogiFlowApiFactory.DefaultPassword);
        var oldToken = GetRefreshToken(loginResponse);
        var firstRefresh = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            oldToken);
        Assert.Equal(HttpStatusCode.OK, firstRefresh.StatusCode);

        var reuseResponse = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            oldToken);

        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_WhenSameTokenIsUsedConcurrently_AllowsOnlyOneRotation()
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, "concurrent.refresh@example.com");
        var loginResponse = await LoginAsync(
            client,
            "concurrent.refresh@example.com",
            LogiFlowApiFactory.DefaultPassword);
        var token = GetRefreshToken(loginResponse);

        using var firstClient = CreateCookieControlledClient();
        using var secondClient = CreateCookieControlledClient();
        var responses = await Task.WhenAll(
            PostWithRefreshCookieAsync(firstClient, "/api/auth/refresh", token),
            PostWithRefreshCookieAsync(secondClient, "/api/auth/refresh", token));

        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(
            responses,
            response => response.StatusCode == HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_WithExpiredToken_ReturnsUnauthorized()
    {
        var token = await CreateRefreshTokenAsync("expired.refresh@example.com");
        await ChangeSessionAsync(token, session =>
            session.ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1));
        using var client = CreateCookieControlledClient();

        var response = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithRevokedToken_ReturnsUnauthorized()
    {
        var token = await CreateRefreshTokenAsync("revoked.refresh@example.com");
        await ChangeSessionAsync(token, session =>
            session.RevokedAt = DateTimeOffset.UtcNow);
        using var client = CreateCookieControlledClient();

        var response = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(UserStatus.Inactive)]
    [InlineData(UserStatus.Suspended)]
    public async Task Refresh_WhenAccountIsNotActive_ReturnsUnauthorized(
        UserStatus status)
    {
        const string email = "status.refresh@example.com";
        var token = await CreateRefreshTokenAsync(email);
        using (var scope = Factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            user.Status = status;
            var updateResult = await userManager.UpdateAsync(user);
            Assert.True(updateResult.Succeeded);
        }

        using var client = CreateCookieControlledClient();
        var response = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_AfterRoleChange_IssuesJwtWithCurrentRole()
    {
        await Factory.ResetDatabaseAsync();
        const string email = "role.refresh@example.com";
        var user = await Factory.CreateUserAsync(email, UserRole.Driver);
        using var client = CreateCookieControlledClient();
        var loginResponse = await LoginAsync(
            client,
            email,
            LogiFlowApiFactory.DefaultPassword);
        var token = GetRefreshToken(loginResponse);

        using (var scope = Factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var currentUser = await userManager.FindByIdAsync(user.Id.ToString());
            Assert.NotNull(currentUser);
            Assert.True((await userManager.RemoveFromRoleAsync(
                currentUser,
                UserRole.Driver.ToString())).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(
                currentUser,
                UserRole.WarehouseStaff.ToString())).Succeeded);
        }

        var response = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/refresh",
            token);
        var refreshed = await ReadJsonAsync<TestLoginResponse>(response);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(
            refreshed.AccessToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(jwt.Claims, claim =>
            claim.Type == ClaimTypes.Role
            && claim.Value == UserRole.WarehouseStaff.ToString());
        Assert.DoesNotContain(jwt.Claims, claim =>
            claim.Type == ClaimTypes.Role
            && claim.Value == UserRole.Driver.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("not-a-real-refresh-token")]
    public async Task Refresh_WithMissingOrInvalidCookie_ReturnsUnauthorized(
        string? token)
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();

        var response = token is null
            ? await client.PostAsync("/api/auth/refresh", null)
            : await PostWithRefreshCookieAsync(
                client,
                "/api/auth/refresh",
                token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesSessionAndClearsRefreshCookie()
    {
        var token = await CreateRefreshTokenAsync("logout.refresh@example.com");
        using var client = CreateCookieControlledClient();

        var response = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/logout",
            token);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var setCookie = GetRefreshCookieHeader(response);
        Assert.Contains($"{RefreshCookieName}=", setCookie);
        Assert.Contains("expires=", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/api/auth", setCookie, StringComparison.OrdinalIgnoreCase);

        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var session = await dbContext.RefreshTokenSessions
            .AsNoTracking()
            .SingleAsync(candidate => candidate.TokenHash == HashToken(token));
        Assert.NotNull(session.RevokedAt);
    }

    [Fact]
    public async Task Logout_WithMissingInvalidOrAlreadyRevokedCookie_IsIdempotent()
    {
        var token = await CreateRefreshTokenAsync("idempotent.logout@example.com");
        using var client = CreateCookieControlledClient();

        var first = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/logout",
            token);
        var repeated = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/logout",
            token);
        var invalid = await PostWithRefreshCookieAsync(
            client,
            "/api/auth/logout",
            "not-a-real-refresh-token");
        var missing = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, repeated.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, invalid.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, missing.StatusCode);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();
        await RegisterAsync(client, "wrong.password@example.com");

        var response = await LoginAsync(
            client,
            "wrong.password@example.com",
            "Wrong123!");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(UserStatus.Inactive)]
    [InlineData(UserStatus.Suspended)]
    public async Task Login_WhenUserIsNotActive_ReturnsForbidden(
        UserStatus status)
    {
        await Factory.ResetDatabaseAsync();
        await Factory.CreateUserAsync(
            "not.active@example.com",
            UserRole.Customer,
            status);
        using var client = Factory.CreateClient();

        var response = await LoginAsync(
            client,
            "not.active@example.com",
            LogiFlowApiFactory.DefaultPassword);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_JwtContainsCorrectRoleClaim()
    {
        await Factory.ResetDatabaseAsync();
        await Factory.CreateUserAsync(
            "driver.jwt@example.com",
            UserRole.Driver);
        using var client = Factory.CreateClient();
        var response = await LoginAsync(
            client,
            "driver.jwt@example.com",
            LogiFlowApiFactory.DefaultPassword);
        var login = await ReadJsonAsync<TestLoginResponse>(response);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(login.AccessToken);

        Assert.Contains(token.Claims, claim =>
            claim.Type == ClaimTypes.Role
            && claim.Value == UserRole.Driver.ToString());
    }

    [Fact]
    public async Task ProtectedUsersApi_WithoutJwt_ReturnsUnauthorized()
    {
        await Factory.ResetDatabaseAsync();
        using var client = Factory.CreateClient();

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidJwt_ReturnsCurrentUser()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.Customer,
            "current.user@example.com");

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await ReadJsonAsync<TestUserResponse>(response);
        Assert.Equal("current.user@example.com", user.Email);
        Assert.Equal(UserRole.Customer.ToString(), user.Role);
    }

    [Fact]
    public async Task ProtectedEndpoint_WhenJwtRoleIsStale_ReturnsUnauthorized()
    {
        await Factory.ResetDatabaseAsync();
        const string email = "stale.manager@example.com";
        var applicationUser = await Factory.CreateUserAsync(
            email,
            UserRole.OperationsManager);
        using var client = Factory.CreateClient();
        var loginResponse = await LoginAsync(
            client,
            email,
            LogiFlowApiFactory.DefaultPassword);
        var login = await ReadJsonAsync<TestLoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                login.AccessToken);

        using (var scope = Factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var currentUser = await userManager.FindByIdAsync(
                applicationUser.Id.ToString());
            Assert.NotNull(currentUser);
            var removeResult = await userManager.RemoveFromRoleAsync(
                currentUser,
                UserRole.OperationsManager.ToString());
            var addResult = await userManager.AddToRoleAsync(
                currentUser,
                UserRole.WarehouseStaff.ToString());

            Assert.True(removeResult.Succeeded);
            Assert.True(addResult.Succeeded);
        }

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task IdentitySeeder_CreatesExactlyFourLogiFlowRoles()
    {
        await Factory.ResetDatabaseAsync();
        using var scope = Factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider
            .GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        var roles = roleManager.Roles
            .Select(role => role.Name!)
            .OrderBy(role => role)
            .ToArray();

        Assert.Equal(
            Enum.GetNames<UserRole>().OrderBy(role => role),
            roles);
    }

    private static Task<HttpResponseMessage> RegisterAsync(
        HttpClient client,
        string email,
        string password = "Test123!")
    {
        return client.PostAsJsonAsync("/api/auth/register", new
        {
            FullName = "Registration Test User",
            Email = email,
            PhoneNumber = "+94771112233",
            Password = password,
            ConfirmPassword = password
        });
    }

    private static Task<HttpResponseMessage> LoginAsync(
        HttpClient client,
        string email,
        string password)
    {
        return client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = password
        });
    }

    private HttpClient CreateCookieControlledClient()
    {
        return Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
    }

    private async Task<string> CreateRefreshTokenAsync(string email)
    {
        await Factory.ResetDatabaseAsync();
        using var client = CreateCookieControlledClient();
        await RegisterAsync(client, email);
        var response = await LoginAsync(
            client,
            email,
            LogiFlowApiFactory.DefaultPassword);
        return GetRefreshToken(response);
    }

    private async Task ChangeSessionAsync(
        string rawToken,
        Action<RefreshTokenSession> change)
    {
        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tokenHash = HashToken(rawToken);
        var session = await dbContext.RefreshTokenSessions
            .SingleAsync(candidate => candidate.TokenHash == tokenHash);
        change(session);
        await dbContext.SaveChangesAsync();
    }

    private static Task<HttpResponseMessage> PostWithRefreshCookieAsync(
        HttpClient client,
        string path,
        string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("Cookie", $"{RefreshCookieName}={token}");
        return client.SendAsync(request);
    }

    private static string GetRefreshToken(HttpResponseMessage response)
    {
        var header = GetRefreshCookieHeader(response);
        var cookiePair = header.Split(';', 2)[0];
        return cookiePair[(RefreshCookieName.Length + 1)..];
    }

    private static string GetRefreshCookieHeader(HttpResponseMessage response)
    {
        return response.Headers.GetValues("Set-Cookie")
            .Single(header => header.StartsWith(
                $"{RefreshCookieName}=",
                StringComparison.Ordinal));
    }

    private static string HashToken(string rawToken)
    {
        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
    }
}
