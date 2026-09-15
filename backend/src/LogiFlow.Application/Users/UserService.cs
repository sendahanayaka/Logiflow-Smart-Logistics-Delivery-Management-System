using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using LogiFlow.Application.Auth;
using LogiFlow.Application.Common;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Users;

public sealed class UserService : IUserService
{
    private const int MaximumPageSize = 100;
    private const string PhonePattern = @"^\+?[0-9][0-9\s().-]{6,30}$";

    private readonly IUserManagementStore _store;

    public UserService(IUserManagementStore store)
    {
        _store = store;
    }

    public async Task<Result<PagedResult<User>>> GetUsersAsync(
        UserQuery query,
        CancellationToken cancellationToken = default)
    {
        if (query.Page < 1)
        {
            return ValidationFailure<PagedResult<User>>(
                "Page must be greater than zero.");
        }

        if (query.PageSize is < 1 or > MaximumPageSize)
        {
            return ValidationFailure<PagedResult<User>>(
                $"PageSize must be between 1 and {MaximumPageSize}.");
        }

        if (query.Role.HasValue && !Enum.IsDefined(query.Role.Value))
        {
            return ValidationFailure<PagedResult<User>>("Role is invalid.");
        }

        if (query.Status.HasValue && !Enum.IsDefined(query.Status.Value))
        {
            return ValidationFailure<PagedResult<User>>("Status is invalid.");
        }

        if (!Enum.IsDefined(query.SortBy)
            || !Enum.IsDefined(query.SortDirection))
        {
            return ValidationFailure<PagedResult<User>>(
                "SortBy or SortDirection is invalid.");
        }

        var users = await _store.GetUsersAsync(query, cancellationToken);
        return Result<PagedResult<User>>.Success(users);
    }

    public async Task<Result<User>> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _store.FindByIdAsync(userId, cancellationToken);

        return user is null
            ? NotFound()
            : Result<User>.Success(user);
    }

    public Task<Result<User>> CreateAsync(
        CreateUserCommand command,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateProfile(
            command.FullName,
            command.Email,
            command.PhoneNumber);

        if (validationError is not null)
        {
            return Task.FromResult(Result<User>.Failure(validationError));
        }

        var passwordErrors = PasswordPolicy.Validate(command.Password);

        if (passwordErrors.Count > 0)
        {
            return Task.FromResult(Result<User>.Failure(new ResultError(
                "users.passwordPolicy",
                "Password does not meet the security requirements.",
                ResultErrorType.Validation,
                passwordErrors)));
        }

        if (!Enum.IsDefined(command.Role))
        {
            return Task.FromResult(
                ValidationFailure<User>("Role is invalid."));
        }

        return _store.CreateAsync(command, cancellationToken);
    }

    public Task<Result<User>> UpdateAsync(
        Guid userId,
        UpdateUserCommand command,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateProfile(
            command.FullName,
            command.Email,
            command.PhoneNumber);

        return validationError is null
            ? _store.UpdateAsync(userId, command, cancellationToken)
            : Task.FromResult(Result<User>.Failure(validationError));
    }

    public async Task<Result<User>> ChangeRoleAsync(
        Guid userId,
        UserRole role,
        Guid currentManagerId,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(role))
        {
            return ValidationFailure<User>("Role is invalid.");
        }

        var user = await _store.FindByIdAsync(userId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        if (user.Role == role)
        {
            return Result<User>.Success(user);
        }

        if (userId == currentManagerId
            && user.Role == UserRole.OperationsManager)
        {
            return Conflict<User>(
                "You cannot remove your own OperationsManager role.");
        }

        if (user.Role == UserRole.OperationsManager
            && user.Status == UserStatus.Active
            && await IsFinalActiveOperationsManagerAsync(cancellationToken))
        {
            return Conflict<User>(
                "The final active OperationsManager cannot lose that role.");
        }

        return await _store.ChangeRoleAsync(userId, role, cancellationToken);
    }

    public async Task<Result<User>> ChangeStatusAsync(
        Guid userId,
        UserStatus status,
        Guid currentManagerId,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(status))
        {
            return ValidationFailure<User>("Status is invalid.");
        }

        var user = await _store.FindByIdAsync(userId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        if (user.Status == status)
        {
            return Result<User>.Success(user);
        }

        if (userId == currentManagerId && status != UserStatus.Active)
        {
            return Conflict<User>(
                "You cannot deactivate or suspend your own account.");
        }

        if (user.Role == UserRole.OperationsManager
            && user.Status == UserStatus.Active
            && status != UserStatus.Active
            && await IsFinalActiveOperationsManagerAsync(cancellationToken))
        {
            return Conflict<User>(
                "The final active OperationsManager cannot be deactivated or suspended.");
        }

        return await _store.ChangeStatusAsync(userId, status, cancellationToken);
    }

    public async Task<Result> DeactivateAsync(
        Guid userId,
        Guid currentManagerId,
        CancellationToken cancellationToken = default)
    {
        var result = await ChangeStatusAsync(
            userId,
            UserStatus.Inactive,
            currentManagerId,
            cancellationToken);

        return result.IsSuccess
            ? Result.Success()
            : Result.Failure(result.Error!);
    }

    private async Task<bool> IsFinalActiveOperationsManagerAsync(
        CancellationToken cancellationToken)
    {
        return await _store.CountActiveOperationsManagersAsync(cancellationToken) <= 1;
    }

    private static ResultError? ValidateProfile(
        string fullName,
        string email,
        string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length > 200)
        {
            return ValidationError(
                "FullName is required and cannot exceed 200 characters.");
        }

        if (string.IsNullOrWhiteSpace(email)
            || email.Length > 256
            || !new EmailAddressAttribute().IsValid(email))
        {
            return ValidationError("Email must be a valid email address.");
        }

        if (string.IsNullOrWhiteSpace(phoneNumber)
            || phoneNumber.Length > 32
            || !Regex.IsMatch(
                phoneNumber,
                PhonePattern,
                RegexOptions.None,
                TimeSpan.FromSeconds(1)))
        {
            return ValidationError("PhoneNumber must be a valid phone number.");
        }

        return null;
    }

    private static Result<T> ValidationFailure<T>(string message) =>
        Result<T>.Failure(ValidationError(message));

    private static ResultError ValidationError(string message) =>
        new("users.validation", message, ResultErrorType.Validation);

    private static Result<User> NotFound() =>
        Result<User>.Failure(new ResultError(
            "users.notFound",
            "User was not found.",
            ResultErrorType.NotFound));

    private static Result<T> Conflict<T>(string message) =>
        Result<T>.Failure(new ResultError(
            "users.conflict",
            message,
            ResultErrorType.Conflict));
}
