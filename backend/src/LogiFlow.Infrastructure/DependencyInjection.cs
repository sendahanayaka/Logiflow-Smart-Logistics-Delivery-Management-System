using LogiFlow.Application.Auth;
using LogiFlow.Application.Users;
using LogiFlow.Infrastructure.Identity;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LogiFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services
            .AddIdentityCore<ApplicationUser>(options =>
                options.User.RequireUniqueEmail = true)
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddScoped<IdentitySeeder>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IUserManagementStore, UserManagementStore>();

        return services;
    }
}
