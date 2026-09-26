using FluentValidation;
using LogiFlow.Api.Controllers;
using LogiFlow.Api.Middleware;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Workflows;
using LogiFlow.Infrastructure.Agents;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using LogiFlow.Application.Auth;
using LogiFlow.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<WarehouseController>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();

var jwtSecret = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
{
    throw new InvalidOperationException("Secure JWT configuration key is required but missing or invalid.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LogiFlow",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LogiFlow",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// [S4] Delivery execution: workflow service + typed HttpClient to the internal agent.
builder.Services.AddScoped<IAgentWorkflowService, AgentWorkflowService>();
builder.Services.AddScoped<IApprovalService, ApprovalService>();

var agentBaseUrl = builder.Configuration["AgentService:BaseUrl"] ?? "http://localhost:8000";
var agentApiKey = builder.Configuration["AgentService:ApiKey"];
builder.Services.AddHttpClient<IAgentServiceClient, AgentServiceClient>(client =>
{
    client.BaseAddress = new Uri(agentBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
    if (!string.IsNullOrWhiteSpace(agentApiKey))
    {
        client.DefaultRequestHeaders.Add("X-Internal-Api-Key", agentApiKey);
    }
});

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();

public partial class Program;
