namespace LogiFlow.Api.DTOs.Users;

public sealed record CreateUserRequest(string Name, string Email, string Password, Guid RoleId);

public sealed record ChangeRoleRequest(Guid RoleId);

public sealed record SetUserStatusRequest(bool IsActive);
