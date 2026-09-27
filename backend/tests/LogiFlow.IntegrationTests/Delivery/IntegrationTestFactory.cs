using System;
using System.Collections.Generic;
using LogiFlow.Application.Workflows;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace LogiFlow.IntegrationTests.Delivery;

/// <summary>
/// Boots the real API in-process, but with an in-memory database and a fake agent
/// client, so the HTTP + auth + controller + service pipeline is exercised end to end
/// without Postgres or the Python agent.
/// </summary>
public sealed class IntegrationTestFactory : WebApplicationFactory<Program>
{
    // Must match the key the JWT test tokens are signed with.
    public const string JwtKey = "test-secret-key-that-is-long-enough-1234567890";

    private readonly string _dbName = $"it-{Guid.NewGuid():N}";

    public IntegrationTestFactory()
    {
        // Program.cs reads config before the host is built, so WebApplicationFactory's
        // config callbacks are too late. appsettings.json ships EMPTY values for these
        // (not null), so Program's `?? env` fallback never fires — we override via the
        // ConfigurationBuilder's env-var convention (double underscore), which wins over
        // appsettings. The DB string is never actually used (we swap in the in-memory context).
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", "Host=localhost;Database=test;Username=t;Password=t");
        Environment.SetEnvironmentVariable("Jwt__Key", JwtKey);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Replace the Npgsql context with an isolated in-memory one.
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_dbName));

            // Replace the typed agent HttpClient with a deterministic fake.
            services.RemoveAll<IAgentServiceClient>();
            services.AddScoped<IAgentServiceClient, FakeAgentServiceClient>();
        });
    }
}
