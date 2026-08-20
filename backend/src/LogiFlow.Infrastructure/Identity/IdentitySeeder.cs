using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace LogiFlow.Infrastructure.Identity;

public sealed class IdentitySeeder
{
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public IdentitySeeder(
        RoleManager<IdentityRole<Guid>> roleManager,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task SeedAsync(
        bool seedDevelopmentOperationsManager = false,
        CancellationToken cancellationToken = default)
    {
        foreach (var roleName in Enum.GetNames<UserRole>())
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (await _roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await _roleManager.CreateAsync(
                new IdentityRole<Guid>(roleName));

            if (!result.Succeeded)
            {
                var errors = string.Join(
                    "; ",
                    result.Errors.Select(error => error.Description));

                throw new InvalidOperationException(
                    $"Could not seed Identity role '{roleName}': {errors}");
            }
        }

        if (seedDevelopmentOperationsManager)
        {
            await SeedDevelopmentOperationsManagerAsync(cancellationToken);
        }
    }

    private async Task SeedDevelopmentOperationsManagerAsync(
        CancellationToken cancellationToken)
    {
        var email = _configuration["IdentitySeed:OperationsManager:Email"];
        var password = _configuration["IdentitySeed:OperationsManager:Password"];

        if (string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        cancellationToken.ThrowIfCancellationRequested();

        var existingUser = await _userManager.FindByEmailAsync(email.Trim());

        if (existingUser is not null)
        {
            if (!await _userManager.IsInRoleAsync(
                existingUser,
                UserRole.OperationsManager.ToString()))
            {
                throw new InvalidOperationException(
                    "The configured development OperationsManager email belongs to a non-manager account.");
            }

            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email.Trim(),
            Email = email.Trim(),
            FullName = _configuration["IdentitySeed:OperationsManager:FullName"]
                ?? "Development Operations Manager",
            PhoneNumber = _configuration["IdentitySeed:OperationsManager:PhoneNumber"],
            Status = UserStatus.Active
        };

        var createResult = await _userManager.CreateAsync(user, password);

        if (!createResult.Succeeded)
        {
            throw SeedFailure("development OperationsManager", createResult);
        }

        var roleResult = await _userManager.AddToRoleAsync(
            user,
            UserRole.OperationsManager.ToString());

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            throw SeedFailure("development OperationsManager role", roleResult);
        }
    }

    private static InvalidOperationException SeedFailure(
        string subject,
        IdentityResult result)
    {
        var errors = string.Join(
            "; ",
            result.Errors.Select(error => error.Description));

        return new InvalidOperationException(
            $"Could not seed {subject}: {errors}");
    }
}
