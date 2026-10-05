// [ALL]  user service
using System.ComponentModel.DataAnnotations;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Users.DTOs;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Users;

public class UserService : IUserService
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IAppDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyList<UserResponse>> ListUsersAsync(CancellationToken cancellationToken = default) =>
        await _context.Users
            .AsNoTracking()
            .OrderByDescending(user => user.CreatedAt)
            .Select(user => new UserResponse(
                user.Id, user.Name, user.Email, user.Role.Name, user.RoleId, user.IsActive, user.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RoleResponse>> ListRolesAsync(CancellationToken cancellationToken = default) =>
        await _context.Roles
            .AsNoTracking()
            .OrderBy(role => role.Name)
            .Select(role => new RoleResponse(role.Id, role.Name))
            .ToListAsync(cancellationToken);

    public async Task<UserResponse> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new ArgumentException("Name is required.", nameof(command.Name));
        }

        if (string.IsNullOrWhiteSpace(command.Email) || !new EmailAddressAttribute().IsValid(command.Email))
        {
            throw new ArgumentException("A valid email is required.", nameof(command.Email));
        }

        if (string.IsNullOrWhiteSpace(command.Password) || command.Password.Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters.", nameof(command.Password));
        }

        var email = command.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == command.RoleId, cancellationToken)
            ?? throw new ArgumentException("Invalid role.", nameof(command.RoleId));

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = command.Name.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.HashPassword(command.Password),
            RoleId = role.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return Map(user, role.Name);
    }

    public async Task<UserResponse> ChangeRoleAsync(Guid userId, ChangeRoleCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User '{userId}' was not found.");

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == command.RoleId, cancellationToken)
            ?? throw new ArgumentException("Invalid role.", nameof(command.RoleId));

        user.RoleId = role.Id;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return Map(user, role.Name);
    }

    public async Task<UserResponse> SetStatusAsync(Guid userId, SetUserStatusCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User '{userId}' was not found.");

        user.IsActive = command.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return Map(user, user.Role.Name);
    }

    private static UserResponse Map(User user, string roleName) =>
        new(user.Id, user.Name, user.Email, roleName, user.RoleId, user.IsActive, user.CreatedAt);
}
