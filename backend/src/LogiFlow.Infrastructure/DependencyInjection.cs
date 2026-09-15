using LogiFlow.Application.Auth;
using LogiFlow.Application.Users;
using LogiFlow.Infrastructure.Auth;
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
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = PasswordPolicy.MinimumLength;
                options.Password.RequiredUniqueChars = 1;
                options.Password.RequireUppercase = PasswordPolicy.RequireUppercase;
                options.Password.RequireLowercase = PasswordPolicy.RequireLowercase;
                options.Password.RequireDigit = PasswordPolicy.RequireDigit;
                options.Password.RequireNonAlphanumeric =
                    PasswordPolicy.RequireNonAlphanumeric;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddScoped<IdentitySeeder>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IRefreshSessionService, RefreshSessionService>();
        services.AddScoped<IUserManagementStore, UserManagementStore>();

        return services;
    }
}
