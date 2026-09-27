namespace LogiFlow.Application.Users.DTOs;

public sealed record UserResponse(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Guid RoleId,
    bool IsActive,
    DateTime CreatedAt);

public sealed record RoleResponse(Guid Id, string Name);

public sealed record CreateUserCommand(string Name, string Email, string Password, Guid RoleId);

public sealed record ChangeRoleCommand(Guid RoleId);

public sealed record SetUserStatusCommand(bool IsActive);
