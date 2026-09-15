using System.Net;
using System.Net.Http.Json;
using LogiFlow.Application.Common;
using LogiFlow.Application.Users;
using LogiFlow.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace LogiFlow.Api.Tests;

[Collection(ApiCollection.Name)]
public sealed class UsersEndpointsTests : ApiTestBase
{
    public UsersEndpointsTests(LogiFlowApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task OperationsManager_CanListUsers()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await ReadPageAsync(response);
        Assert.NotEmpty(page.Items);
    }

    [Theory]
    [InlineData(UserRole.Customer)]
    [InlineData(UserRole.Driver)]
    [InlineData(UserRole.WarehouseStaff)]
    public async Task NonManagerRole_CannotListUsers(UserRole role)
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(role);

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task List_SearchesByNameAndEmail()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync(
            "needle@example.com",
            UserRole.Customer,
            fullName: "Distinctive Search Name");
        await Factory.CreateUserAsync(
            "other@example.com",
            UserRole.Customer,
            fullName: "Other Person");

        var response = await client.GetAsync("/api/users?search=Distinctive");
        var page = await ReadPageAsync(response);

        var user = Assert.Single(page.Items);
        Assert.Equal("needle@example.com", user.Email);
    }

    [Fact]
    public async Task List_FiltersByRole()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync("driver.filter@example.com", UserRole.Driver);
        await Factory.CreateUserAsync("customer.filter@example.com", UserRole.Customer);

        var response = await client.GetAsync("/api/users?role=Driver");
        var page = await ReadPageAsync(response);

        Assert.NotEmpty(page.Items);
        Assert.All(page.Items, user => Assert.Equal("Driver", user.Role));
    }

    [Fact]
    public async Task List_FiltersByStatus()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync(
            "suspended.filter@example.com",
            UserRole.Customer,
            UserStatus.Suspended);
        await Factory.CreateUserAsync("active.filter@example.com", UserRole.Customer);

        var response = await client.GetAsync("/api/users?status=Suspended");
        var page = await ReadPageAsync(response);

        var user = Assert.Single(page.Items);
        Assert.Equal("Suspended", user.Status);
    }

    [Fact]
    public async Task List_SortsUsers()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync(
            "zulu@example.com",
            UserRole.Customer,
            fullName: "Zulu User");
        await Factory.CreateUserAsync(
            "alpha@example.com",
            UserRole.Customer,
            fullName: "Alpha User");

        var response = await client.GetAsync(
            "/api/users?role=Customer&sortBy=FullName&sortDirection=Asc");
        var page = await ReadPageAsync(response);

        Assert.Equal(
            new[] { "Alpha User", "Zulu User" },
            page.Items.Select(user => user.FullName));
    }

    [Fact]
    public async Task List_PaginatesOnServer()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync("page1@example.com", UserRole.Customer);
        await Factory.CreateUserAsync("page2@example.com", UserRole.Customer);
        await Factory.CreateUserAsync("page3@example.com", UserRole.Customer);

        var response = await client.GetAsync(
            "/api/users?role=Customer&page=2&pageSize=2&sortBy=Email&sortDirection=Asc");
        var page = await ReadPageAsync(response);

        Assert.Equal(2, page.Page);
        Assert.Equal(2, page.PageSize);
        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.TotalPages);
        Assert.Single(page.Items);
    }

    [Fact]
    public async Task CreateUser_WithValidRequest_ReturnsCreatedUser()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);

        var response = await client.PostAsJsonAsync("/api/users", new
        {
            FullName = "New Warehouse User",
            Email = "created.user@example.com",
            PhoneNumber = "+94772223344",
            Password = "Test123!",
            Role = "WarehouseStaff"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(response);
        Assert.True(envelope.Success);
        Assert.Equal("WarehouseStaff", envelope.Data!.Role);
    }

    [Fact]
    public async Task CreateUser_WithDuplicateEmail_ReturnsConflict()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        await Factory.CreateUserAsync("duplicate.user@example.com", UserRole.Customer);

        var response = await client.PostAsJsonAsync("/api/users", new
        {
            FullName = "Duplicate User",
            Email = "duplicate.user@example.com",
            PhoneNumber = "+94772223344",
            Password = "Test123!",
            Role = "Driver"
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("lowercase1!")]
    [InlineData("UPPERCASE1!")]
    [InlineData("NoNumber!")]
    [InlineData("NoSpecial1")]
    [InlineData("Aa1!xyz")]
    public async Task CreateUser_WithPasswordOutsideSharedPolicy_ReturnsBadRequest(
        string password)
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);

        var response = await client.PostAsJsonAsync("/api/users", new
        {
            FullName = "Invalid Password User",
            Email = $"invalid-password-{Guid.NewGuid():N}@example.com",
            PhoneNumber = "+94772223344",
            Password = password,
            Role = "Driver"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUser_ChangesEditableProfile()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        var user = await Factory.CreateUserAsync(
            "before.update@example.com",
            UserRole.Customer);

        var response = await client.PutAsJsonAsync($"/api/users/{user.Id}", new
        {
            FullName = "Updated Full Name",
            Email = "after.update@example.com",
            PhoneNumber = "+94773334455"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(response);
        Assert.Equal("Updated Full Name", envelope.Data!.FullName);
        Assert.Equal("after.update@example.com", envelope.Data.Email);
    }

    [Fact]
    public async Task GetUser_ReturnsProfileAndAuditFields()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        var user = await Factory.CreateUserAsync(
            "details@example.com",
            UserRole.WarehouseStaff,
            fullName: "Details Test User");

        var response = await client.GetAsync($"/api/users/{user.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(response);
        Assert.Equal("Details Test User", envelope.Data!.FullName);
        Assert.Equal("WarehouseStaff", envelope.Data.Role);
        Assert.NotEqual(default, envelope.Data.CreatedAt);
        Assert.NotEqual(default, envelope.Data.UpdatedAt);
    }

    [Fact]
    public async Task ChangeRole_UsesDedicatedEndpoint()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        var user = await Factory.CreateUserAsync(
            "change.role@example.com",
            UserRole.Customer);

        var response = await client.PatchAsJsonAsync(
            $"/api/users/{user.Id}/role",
            new { Role = "Driver" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(response);
        Assert.Equal("Driver", envelope.Data!.Role);
    }

    [Fact]
    public async Task ChangeStatus_UsesDedicatedEndpoint()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        var user = await Factory.CreateUserAsync(
            "change.status@example.com",
            UserRole.Customer);

        var response = await client.PatchAsJsonAsync(
            $"/api/users/{user.Id}/status",
            new { Status = "Suspended" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(response);
        Assert.Equal("Suspended", envelope.Data!.Status);
    }

    [Fact]
    public async Task Delete_DeactivatesInsteadOfRemovingUser()
    {
        await Factory.ResetDatabaseAsync();
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager);
        var user = await Factory.CreateUserAsync(
            "deactivate@example.com",
            UserRole.Customer);

        var response = await client.DeleteAsync($"/api/users/{user.Id}");
        var getResponse = await client.GetAsync($"/api/users/{user.Id}");
        var envelope = await ReadJsonAsync<TestApiResponse<TestUserResponse>>(getResponse);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Inactive", envelope.Data!.Status);
    }

    [Fact]
    public async Task OperationsManager_CannotDeactivateOwnAccount()
    {
        await Factory.ResetDatabaseAsync();
        const string managerEmail = "self.manager@example.com";
        using var client = await CreateAuthorizedClientAsync(
            UserRole.OperationsManager,
            managerEmail);
        var listResponse = await client.GetAsync($"/api/users?search={managerEmail}");
        var manager = Assert.Single((await ReadPageAsync(listResponse)).Items);

        var response = await client.DeleteAsync($"/api/users/{manager.Id}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task FinalActiveOperationsManager_CannotLoseRole()
    {
        await Factory.ResetDatabaseAsync();
        var finalManager = await Factory.CreateUserAsync(
            "final.manager@example.com",
            UserRole.OperationsManager);
        using var scope = Factory.Services.CreateScope();
        var userService = scope.ServiceProvider.GetRequiredService<IUserService>();

        var result = await userService.ChangeRoleAsync(
            finalManager.Id,
            UserRole.Customer,
            Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Conflict, result.Error!.Type);
        Assert.Contains("final active OperationsManager", result.Error.Message);
    }

    private static async Task<TestPagedResult<TestUserResponse>> ReadPageAsync(
        HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        var envelope = await ReadJsonAsync<
            TestApiResponse<TestPagedResult<TestUserResponse>>>(response);
        Assert.True(envelope.Success);
        return envelope.Data!;
    }
}
