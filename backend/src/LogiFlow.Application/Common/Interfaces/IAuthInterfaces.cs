using LogiFlow.Domain.Entities;
using System.Threading.Tasks;

namespace LogiFlow.Application.Common.Interfaces;

public interface IAuthService
{
    Task<Auth.DTOs.AuthResponse> RegisterAsync(Auth.DTOs.RegisterRequest request);
    Task<Auth.DTOs.AuthResponse> LoginAsync(Auth.DTOs.LoginRequest request);
    Task<Auth.DTOs.UserDto> GetCurrentUserAsync(string userEmail);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string roleName);
}
