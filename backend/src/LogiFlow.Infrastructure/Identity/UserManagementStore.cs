using LogiFlow.Application.Common;
using LogiFlow.Application.Users;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using DomainUser = LogiFlow.Domain.Entities.User;

namespace LogiFlow.Infrastructure.Identity;

public sealed class UserManagementStore : IUserManagementStore
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserManagementStore(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<PagedResult<DomainUser>> GetUsersAsync(
        UserQuery query,
        CancellationToken cancellationToken = default)
    {
        var usersQuery =
            from applicationUser in _dbContext.Users.AsNoTracking()
            join userRole in _dbContext.UserRoles.AsNoTracking()
                on applicationUser.Id equals userRole.UserId
            join identityRole in _dbContext.Roles.AsNoTracking()
                on userRole.RoleId equals identityRole.Id
            select new
            {
                ApplicationUser = applicationUser,
                RoleName = identityRole.Name!
            };

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            usersQuery = usersQuery.Where(item =>
                EF.Functions.ILike(item.ApplicationUser.FullName, pattern)
                || EF.Functions.ILike(item.ApplicationUser.Email!, pattern));
        }

        if (query.Role.HasValue)
        {
            var roleName = query.Role.Value.ToString();
            usersQuery = usersQuery.Where(item => item.RoleName == roleName);
        }

        if (query.Status.HasValue)
        {
            usersQuery = usersQuery.Where(item =>
                item.ApplicationUser.Status == query.Status.Value);
        }

        usersQuery = (query.SortBy, query.SortDirection) switch
        {
            (UserSortBy.FullName, SortDirection.Asc) =>
                usersQuery.OrderBy(item => item.ApplicationUser.FullName),
            (UserSortBy.FullName, SortDirection.Desc) =>
                usersQuery.OrderByDescending(item => item.ApplicationUser.FullName),
            (UserSortBy.Email, SortDirection.Asc) =>
                usersQuery.OrderBy(item => item.ApplicationUser.Email),
            (UserSortBy.Email, SortDirection.Desc) =>
                usersQuery.OrderByDescending(item => item.ApplicationUser.Email),
            (UserSortBy.CreatedAt, SortDirection.Asc) =>
                usersQuery.OrderBy(item => item.ApplicationUser.CreatedAt),
            _ => usersQuery.OrderByDescending(item => item.ApplicationUser.CreatedAt)
        };

        var totalCount = await usersQuery.CountAsync(cancellationToken);
        var rows = await usersQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        var users = rows
            .Select(row => ToDomainUser(row.ApplicationUser, row.RoleName))
            .ToArray();

        return new PagedResult<DomainUser>(
            users,
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<DomainUser?> FindByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var applicationUser = await _dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);

        return applicationUser is null
            ? null
            : await ToDomainUserAsync(applicationUser, cancellationToken);
    }

    public async Task<Result<DomainUser>> CreateAsync(
        CreateUserCommand command,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = command.Email.Trim();
        var existingUser = await _userManager.FindByEmailAsync(email);

        if (existingUser is not null)
        {
            return DuplicateEmail();
        }

        await using var transaction = await _dbContext.Database
            .BeginTransactionAsync(cancellationToken);

        var applicationUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = command.FullName.Trim(),
            PhoneNumber = command.PhoneNumber.Trim(),
            Status = UserStatus.Active
        };

        var createResult = await _userManager.CreateAsync(
            applicationUser,
            command.Password);

        if (!createResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return IdentityFailure(createResult);
        }

        var roleResult = await _userManager.AddToRoleAsync(
            applicationUser,
            command.Role.ToString());

        if (!roleResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return IdentityFailure(roleResult);
        }

        await transaction.CommitAsync(cancellationToken);

        return Result<DomainUser>.Success(
            await ToDomainUserAsync(applicationUser, cancellationToken));
    }

    public async Task<Result<DomainUser>> UpdateAsync(
        Guid userId,
        UpdateUserCommand command,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());

        if (applicationUser is null)
        {
            return NotFound();
        }

        var email = command.Email.Trim();
        var emailOwner = await _userManager.FindByEmailAsync(email);

        if (emailOwner is not null && emailOwner.Id != userId)
        {
            return DuplicateEmail();
        }

        applicationUser.FullName = command.FullName.Trim();
        applicationUser.Email = email;
        applicationUser.UserName = email;
        applicationUser.PhoneNumber = command.PhoneNumber.Trim();

        var updateResult = await _userManager.UpdateAsync(applicationUser);

        if (!updateResult.Succeeded)
        {
            return IdentityFailure(updateResult);
        }

        return Result<DomainUser>.Success(
            await ToDomainUserAsync(applicationUser, cancellationToken));
    }

    public async Task<Result<DomainUser>> ChangeRoleAsync(
        Guid userId,
        UserRole role,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());

        if (applicationUser is null)
        {
            return NotFound();
        }

        await using var transaction = await _dbContext.Database
            .BeginTransactionAsync(cancellationToken);
        var currentRoles = await _userManager.GetRolesAsync(applicationUser);

        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(
                applicationUser,
                currentRoles);

            if (!removeResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                return IdentityFailure(removeResult);
            }
        }

        var addResult = await _userManager.AddToRoleAsync(
            applicationUser,
            role.ToString());

        if (!addResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return IdentityFailure(addResult);
        }

        await transaction.CommitAsync(cancellationToken);

        return Result<DomainUser>.Success(
            await ToDomainUserAsync(applicationUser, cancellationToken));
    }

    public async Task<Result<DomainUser>> ChangeStatusAsync(
        Guid userId,
        UserStatus status,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());

        if (applicationUser is null)
        {
            return NotFound();
        }

        applicationUser.Status = status;
        var updateResult = await _userManager.UpdateAsync(applicationUser);

        if (!updateResult.Succeeded)
        {
            return IdentityFailure(updateResult);
        }

        return Result<DomainUser>.Success(
            await ToDomainUserAsync(applicationUser, cancellationToken));
    }

    public Task<int> CountActiveOperationsManagersAsync(
        CancellationToken cancellationToken = default)
    {
        var roleName = UserRole.OperationsManager.ToString();

        return (
            from applicationUser in _dbContext.Users.AsNoTracking()
            join userRole in _dbContext.UserRoles.AsNoTracking()
                on applicationUser.Id equals userRole.UserId
            join identityRole in _dbContext.Roles.AsNoTracking()
                on userRole.RoleId equals identityRole.Id
            where applicationUser.Status == UserStatus.Active
                && identityRole.Name == roleName
            select applicationUser.Id)
            .Distinct()
            .CountAsync(cancellationToken);
    }

    private async Task<DomainUser> ToDomainUserAsync(
        ApplicationUser applicationUser,
        CancellationToken cancellationToken)
    {
        var roleNames = await (
            from userRole in _dbContext.UserRoles.AsNoTracking()
            join identityRole in _dbContext.Roles.AsNoTracking()
                on userRole.RoleId equals identityRole.Id
            where userRole.UserId == applicationUser.Id
            select identityRole.Name!)
            .ToArrayAsync(cancellationToken);

        if (roleNames.Length != 1)
        {
            throw new InvalidOperationException(
                $"Identity user '{applicationUser.Id}' must have exactly one LogiFlow role.");
        }

        return ToDomainUser(applicationUser, roleNames[0]);
    }

    private static DomainUser ToDomainUser(
        ApplicationUser applicationUser,
        string roleName)
    {
        if (!Enum.TryParse<UserRole>(roleName, out var role))
        {
            throw new InvalidOperationException(
                $"Identity user '{applicationUser.Id}' has an unknown role.");
        }

        return new DomainUser
        {
            Id = applicationUser.Id,
            FullName = applicationUser.FullName,
            Email = applicationUser.Email
                ?? throw new InvalidOperationException(
                    $"Identity user '{applicationUser.Id}' has no email address."),
            PhoneNumber = applicationUser.PhoneNumber,
            Role = role,
            Status = applicationUser.Status,
            CreatedAt = applicationUser.CreatedAt,
            UpdatedAt = applicationUser.UpdatedAt
        };
    }

    private static Result<DomainUser> NotFound() =>
        Result<DomainUser>.Failure(new ResultError(
            "users.notFound",
            "User was not found.",
            ResultErrorType.NotFound));

    private static Result<DomainUser> DuplicateEmail() =>
        Result<DomainUser>.Failure(new ResultError(
            "users.duplicateEmail",
            "An account with this email address already exists.",
            ResultErrorType.Conflict));

    private static Result<DomainUser> IdentityFailure(IdentityResult result)
    {
        var duplicateEmail = result.Errors.Any(error =>
            error.Code is "DuplicateEmail" or "DuplicateUserName");
        var errors = result.Errors
            .Select(error => error.Description)
            .ToArray();

        return Result<DomainUser>.Failure(new ResultError(
            duplicateEmail ? "users.duplicateEmail" : "users.identityError",
            duplicateEmail
                ? "An account with this email address already exists."
                : "Identity could not complete the user operation.",
            duplicateEmail
                ? ResultErrorType.Conflict
                : ResultErrorType.Validation,
            errors));
    }
}
