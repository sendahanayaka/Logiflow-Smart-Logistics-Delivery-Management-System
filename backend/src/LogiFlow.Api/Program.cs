using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using FluentValidation;
using LogiFlow.Api.Configuration;
using LogiFlow.Api.Validators.Auth;
using LogiFlow.Application.Auth;
using LogiFlow.Application.Users;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure;
using LogiFlow.Infrastructure.Auth;
using LogiFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var jwtOptions = GetJwtOptions(builder.Configuration);
var refreshCookieOptions = GetRefreshCookieOptions(builder.Configuration);
var corsAllowedOrigins = GetCorsAllowedOrigins(builder.Configuration);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter the JWT access token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        }] = Array.Empty<string>()
    });
});
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton(refreshCookieOptions);
builder.Services.AddSingleton<ITokenService, TokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var userIdValue = context.Principal?
                    .FindFirst(ClaimTypes.NameIdentifier)?
                    .Value;

                if (!Guid.TryParse(userIdValue, out var userId))
                {
                    context.Fail("The token has no valid user identifier.");
                    return;
                }

                var authService = context.HttpContext.RequestServices
                    .GetRequiredService<IAuthService>();
                var user = await authService.GetCurrentUserAsync(
                    userId,
                    context.HttpContext.RequestAborted);

                if (user is null || user.Status != UserStatus.Active)
                {
                    context.Fail("The user account is not active.");
                    return;
                }

                var roleClaims = context.Principal?
                    .FindAll(ClaimTypes.Role)
                    .Select(claim => claim.Value)
                    .ToArray()
                    ?? Array.Empty<string>();

                if (roleClaims.Length != 1
                    || !string.Equals(
                        roleClaims[0],
                        user.Role.ToString(),
                        StringComparison.Ordinal))
                {
                    context.Fail(
                        "The token role does not match the user's current role.");
                }
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        if (corsAllowedOrigins.Length > 0)
        {
            policy.WithOrigins(corsAllowedOrigins);
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var identitySeeder = scope.ServiceProvider
        .GetRequiredService<IdentitySeeder>();

    await identitySeeder.SeedAsync(app.Environment.IsDevelopment());
}

app.Run();

static JwtOptions GetJwtOptions(IConfiguration configuration)
{
    var issuer = configuration["Jwt:Issuer"];
    var audience = configuration["Jwt:Audience"];
    var signingKey = configuration["Jwt:SigningKey"];
    var expiryValue = configuration["Jwt:ExpiryMinutes"];
    var refreshExpiryValue = configuration["Jwt:RefreshTokenExpiryDays"];

    if (string.IsNullOrWhiteSpace(issuer))
    {
        throw new InvalidOperationException("Jwt:Issuer must be configured.");
    }

    if (string.IsNullOrWhiteSpace(audience))
    {
        throw new InvalidOperationException("Jwt:Audience must be configured.");
    }

    if (string.IsNullOrWhiteSpace(signingKey)
        || Encoding.UTF8.GetByteCount(signingKey) < 32)
    {
        throw new InvalidOperationException(
            "Jwt:SigningKey must be configured with at least 32 bytes.");
    }

    if (!int.TryParse(expiryValue, out var expiryMinutes)
        || expiryMinutes <= 0)
    {
        throw new InvalidOperationException(
            "Jwt:ExpiryMinutes must be a positive integer.");
    }

    if (!int.TryParse(refreshExpiryValue, out var refreshTokenExpiryDays)
        || refreshTokenExpiryDays <= 0)
    {
        throw new InvalidOperationException(
            "Jwt:RefreshTokenExpiryDays must be a positive integer.");
    }

    return new JwtOptions(
        issuer,
        audience,
        signingKey,
        expiryMinutes,
        refreshTokenExpiryDays);
}

static RefreshCookieOptions GetRefreshCookieOptions(
    IConfiguration configuration)
{
    var secureValue = configuration["AuthCookies:RefreshTokenSecure"];

    if (!bool.TryParse(secureValue, out var secure))
    {
        throw new InvalidOperationException(
            "AuthCookies:RefreshTokenSecure must be configured as true or false.");
    }

    return new RefreshCookieOptions(secure);
}

static string[] GetCorsAllowedOrigins(IConfiguration configuration)
{
    return configuration.GetSection("Cors:AllowedOrigins")
        .Get<string[]>()?
        .Select(origin => origin.Trim().TrimEnd('/'))
        .Where(origin => !string.IsNullOrWhiteSpace(origin))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray()
        ?? Array.Empty<string>();
}

public partial class Program;
