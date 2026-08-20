using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LogiFlow.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace LogiFlow.Application.Auth;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _options;

    public TokenService(JwtOptions options)
    {
        _options = options;
    }

    public AccessToken CreateAccessToken(User user)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_options.ExpiryMinutes);
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_options.SigningKey));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256));

        return new AccessToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt);
    }
}
