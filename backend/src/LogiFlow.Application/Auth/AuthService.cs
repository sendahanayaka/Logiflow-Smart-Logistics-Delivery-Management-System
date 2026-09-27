using LogiFlow.Application.Auth.DTOs;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace LogiFlow.Application.Auth;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IAppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
            throw new ArgumentException("Invalid email format.");

        var normalizedEmail = request.Email.ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
            throw new InvalidOperationException("Email is already registered."); // 409 Conflict

        var role = await _context.Roles.FindAsync(request.RoleId);
        if (role == null)
            throw new ArgumentException("Invalid role selected.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            RoleId = request.RoleId,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtTokenGenerator.GenerateToken(user, role.Name);

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = role.Name,
                IsActive = user.IsActive
            }
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !user.IsActive || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password."); // 401 Unauthorized

        var token = _jwtTokenGenerator.GenerateToken(user, user.Role.Name);

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.Name,
                IsActive = user.IsActive
            }
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(string userEmail)
    {
        var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("User not found or inactive.");

        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.Name,
            IsActive = user.IsActive
        };
    }
}
