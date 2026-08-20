using LogiFlow.Application.Auth;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace LogiFlow.Infrastructure.Identity;

public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<RegistrationResult> CreateCustomerAsync(
        string fullName,
        string email,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var normalizedEmail = email.Trim();
        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);

        if (existingUser is not null)
        {
            return Failure(
                AuthFailure.DuplicateEmail,
                "An account with this email address already exists.");
        }

        var applicationUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FullName = fullName.Trim(),
            PhoneNumber = phoneNumber.Trim(),
            Status = UserStatus.Active
        };

        var createResult = await _userManager.CreateAsync(
            applicationUser,
            password);

        if (!createResult.Succeeded)
        {
            var failure = createResult.Errors.Any(error =>
                error.Code is "DuplicateEmail" or "DuplicateUserName")
                ? AuthFailure.DuplicateEmail
                : AuthFailure.IdentityError;

            return Failure(
                failure,
                createResult.Errors.Select(error => error.Description));
        }

        var roleResult = await _userManager.AddToRoleAsync(
            applicationUser,
            UserRole.Customer.ToString());

        if (!roleResult.Succeeded)
        {
            var deleteResult = await _userManager.DeleteAsync(applicationUser);
            var errors = roleResult.Errors.Select(error => error.Description)
                .Concat(deleteResult.Errors.Select(error => error.Description))
                .ToArray();

            return Failure(AuthFailure.IdentityError, errors);
        }

        var user = await ToDomainUserAsync(applicationUser);

        return new RegistrationResult(
            user,
            AuthFailure.None,
            Array.Empty<string>());
    }

    public async Task<User?> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var applicationUser = await _userManager.FindByEmailAsync(email.Trim());

        if (applicationUser is null
            || !await _userManager.CheckPasswordAsync(applicationUser, password))
        {
            return null;
        }

        return await ToDomainUserAsync(applicationUser);
    }

    public async Task<User?> FindByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());

        return applicationUser is null
            ? null
            : await ToDomainUserAsync(applicationUser);
    }

    private async Task<User> ToDomainUserAsync(ApplicationUser applicationUser)
    {
        var roleNames = await _userManager.GetRolesAsync(applicationUser);
        var roles = roleNames
            .Where(roleName => Enum.TryParse<UserRole>(roleName, out _))
            .Select(Enum.Parse<UserRole>)
            .ToArray();

        if (roles.Length != 1)
        {
            throw new InvalidOperationException(
                $"Identity user '{applicationUser.Id}' must have exactly one LogiFlow role.");
        }

        return new User
        {
            Id = applicationUser.Id,
            FullName = applicationUser.FullName,
            Email = applicationUser.Email
                ?? throw new InvalidOperationException(
                    $"Identity user '{applicationUser.Id}' has no email address."),
            PhoneNumber = applicationUser.PhoneNumber,
            Role = roles[0],
            Status = applicationUser.Status,
            CreatedAt = applicationUser.CreatedAt,
            UpdatedAt = applicationUser.UpdatedAt
        };
    }

    private static RegistrationResult Failure(
        AuthFailure failure,
        params string[] errors)
    {
        return new RegistrationResult(null, failure, errors);
    }

    private static RegistrationResult Failure(
        AuthFailure failure,
        IEnumerable<string> errors)
    {
        return new RegistrationResult(null, failure, errors.ToArray());
    }
}
