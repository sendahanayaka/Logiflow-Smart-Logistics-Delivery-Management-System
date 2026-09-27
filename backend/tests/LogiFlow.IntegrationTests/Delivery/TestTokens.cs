using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LogiFlow.IntegrationTests.Delivery;

/// <summary>Mints JWTs signed with the factory's test key, mirroring JwtTokenGenerator.</summary>
public static class TestTokens
{
    public static string For(string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(IntegrationTestFactory.JwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "LogiFlow",
            audience: "LogiFlow",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
