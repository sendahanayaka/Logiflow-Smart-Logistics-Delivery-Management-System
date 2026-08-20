using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Identity;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace LogiFlow.Api.Tests;

public sealed class LogiFlowApiFactory : WebApplicationFactory<Program>
{
    public const string DefaultPassword = "Test123!";
    private const string TestSigningKey =
        "LogiFlow.Tests.SigningKey.Only.For.Automated.Tests.2026";

    public LogiFlowApiFactory()
    {
        ConnectionString = Environment.GetEnvironmentVariable(
            "LOGIFLOW_TEST_CONNECTION_STRING")
            ?? "Host=127.0.0.1;Port=55432;Database=logiflow_tests;Username=postgres";

        var databaseName = new NpgsqlConnectionStringBuilder(ConnectionString)
            .Database;

        if (string.IsNullOrWhiteSpace(databaseName)
            || !databaseName.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "The integration-test database name must contain 'test'.");
        }

        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection",
            ConnectionString);
        Environment.SetEnvironmentVariable("Jwt__Issuer", "LogiFlow.Api.Tests");
        Environment.SetEnvironmentVariable(
            "Jwt__Audience",
            "LogiFlow.TestClient");
        Environment.SetEnvironmentVariable("Jwt__SigningKey", TestSigningKey);
        Environment.SetEnvironmentVariable("Jwt__ExpiryMinutes", "30");

        RecreateDatabaseBeforeApplicationStarts();
    }

    public string ConnectionString { get; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ConnectionString,
                ["Jwt:Issuer"] = "LogiFlow.Api.Tests",
                ["Jwt:Audience"] = "LogiFlow.TestClient",
                ["Jwt:SigningKey"] = TestSigningKey,
                ["Jwt:ExpiryMinutes"] = "30"
            });
        });
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.EnsureDeletedAsync();
        await dbContext.Database.EnsureCreatedAsync();

        var seeder = scope.ServiceProvider.GetRequiredService<IdentitySeeder>();
        await seeder.SeedAsync();
    }

    public async Task<ApplicationUser> CreateUserAsync(
        string email,
        UserRole role,
        UserStatus status = UserStatus.Active,
        string? fullName = null)
    {
        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider
            .GetRequiredService<UserManager<ApplicationUser>>();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = fullName ?? $"{role} Test User",
            PhoneNumber = "+94770000000",
            Status = status
        };

        var createResult = await userManager.CreateAsync(user, DefaultPassword);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(
                "; ",
                createResult.Errors.Select(error => error.Description)));
        }

        var roleResult = await userManager.AddToRoleAsync(user, role.ToString());
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(
                "; ",
                roleResult.Errors.Select(error => error.Description)));
        }

        return user;
    }

    private void RecreateDatabaseBeforeApplicationStarts()
    {
        NpgsqlConnection.ClearAllPools();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        using var dbContext = new AppDbContext(options);
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<LogiFlowApiFactory>
{
    public const string Name = "LogiFlow API integration tests";
}
