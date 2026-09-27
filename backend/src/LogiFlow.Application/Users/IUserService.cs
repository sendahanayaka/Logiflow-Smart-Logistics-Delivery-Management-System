// [ALL]  user service contract
using LogiFlow.Application.Users.DTOs;

namespace LogiFlow.Application.Users;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> ListUsersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoleResponse>> ListRolesAsync(CancellationToken cancellationToken = default);
    Task<UserResponse> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken = default);
    Task<UserResponse> ChangeRoleAsync(Guid userId, ChangeRoleCommand command, CancellationToken cancellationToken = default);
    Task<UserResponse> SetStatusAsync(Guid userId, SetUserStatusCommand command, CancellationToken cancellationToken = default);
}
