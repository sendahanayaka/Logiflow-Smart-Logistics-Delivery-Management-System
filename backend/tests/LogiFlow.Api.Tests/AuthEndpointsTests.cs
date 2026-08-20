using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace LogiFlow.Api.Tests;

[Collection(ApiCollection.Name)]
public sealed class AuthEndpointsTests : ApiTestBase
{
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

        var response = await RegisterAsync(client, "role.check@example.com");

        var user = await ReadJsonAsync<TestUserResponse>(response);
        Assert.Equal(UserRole.Customer.ToString(), user.Role);
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

    [Fact]
    public async Task Login_WhenUserIsSuspended_ReturnsForbidden()
    {
        await Factory.ResetDatabaseAsync();
        await Factory.CreateUserAsync(
            "suspended@example.com",
            UserRole.Customer,
            UserStatus.Suspended);
        using var client = Factory.CreateClient();

        var response = await LoginAsync(
            client,
            "suspended@example.com",
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
        string email)
    {
        return client.PostAsJsonAsync("/api/auth/register", new
        {
            FullName = "Registration Test User",
            Email = email,
            PhoneNumber = "+94771112233",
            Password = "Test123!",
            ConfirmPassword = "Test123!"
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
}
