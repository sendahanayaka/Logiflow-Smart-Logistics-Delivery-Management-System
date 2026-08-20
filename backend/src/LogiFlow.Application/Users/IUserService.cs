using LogiFlow.Application.Common;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Users;

public interface IUserService
{
    Task<Result<PagedResult<User>>> GetUsersAsync(
        UserQuery query,
        CancellationToken cancellationToken = default);

    Task<Result<User>> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<Result<User>> CreateAsync(
        CreateUserCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<User>> UpdateAsync(
        Guid userId,
        UpdateUserCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<User>> ChangeRoleAsync(
        Guid userId,
        UserRole role,
        Guid currentManagerId,
        CancellationToken cancellationToken = default);

    Task<Result<User>> ChangeStatusAsync(
        Guid userId,
        UserStatus status,
        Guid currentManagerId,
        CancellationToken cancellationToken = default);

    Task<Result> DeactivateAsync(
        Guid userId,
        Guid currentManagerId,
        CancellationToken cancellationToken = default);
}

public enum UserSortBy
{
    FullName,
    Email,
    CreatedAt
}

public enum SortDirection
{
    Asc,
    Desc
}

public sealed record UserQuery(
    string? Search,
    UserRole? Role,
    UserStatus? Status,
    UserSortBy SortBy,
    SortDirection SortDirection,
    int Page,
    int PageSize);

public sealed record CreateUserCommand(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    UserRole Role);

public sealed record UpdateUserCommand(
    string FullName,
    string Email,
    string PhoneNumber);

public interface IUserManagementStore
{
    Task<PagedResult<User>> GetUsersAsync(
        UserQuery query,
        CancellationToken cancellationToken = default);

    Task<User?> FindByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<Result<User>> CreateAsync(
        CreateUserCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<User>> UpdateAsync(
        Guid userId,
        UpdateUserCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<User>> ChangeRoleAsync(
        Guid userId,
        UserRole role,
        CancellationToken cancellationToken = default);

    Task<Result<User>> ChangeStatusAsync(
        Guid userId,
        UserStatus status,
        CancellationToken cancellationToken = default);

    Task<int> CountActiveOperationsManagersAsync(
        CancellationToken cancellationToken = default);
}
