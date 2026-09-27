using FluentValidation;
using LogiFlow.Api.Controllers;
using LogiFlow.Api.Middleware;
using LogiFlow.Application.Auth;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Fleet;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Workflows;
using LogiFlow.Infrastructure.Agents;
using LogiFlow.Infrastructure.Auth;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using LogiFlow.Application.Orders;
using LogiFlow.Application.Common.Interfaces;

// Enable Npgsql legacy timestamp behavior for flexible DateTime handling with PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add API controllers & FluentValidation & Swagger documentation
builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<WarehouseController>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "LogiFlow API",
        Version = "v1"
    });
});

// Configure AppDbContext with PostgreSQL dynamically from configuration or environment
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' was not found in configuration or environment variables.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register Application & Infrastructure services in DI
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IFleetService, FleetService>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddSingleton<BatchingEngine>();
builder.Services.AddScoped<IDispatchBatchService, DispatchBatchService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IOrdersService, OrdersService>();

// [S4] Delivery execution: workflow + approval + shipment services, and the typed
// HttpClient to the internal Python agent.
builder.Services.AddScoped<IAgentWorkflowService, AgentWorkflowService>();
builder.Services.AddScoped<IApprovalService, ApprovalService>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();

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

// Configure JWT Authentication
var jwtKeyFromConfig = builder.Configuration["Jwt:Key"];
var jwtSecret = !string.IsNullOrWhiteSpace(jwtKeyFromConfig)
    ? jwtKeyFromConfig
    : (Environment.GetEnvironmentVariable("JWT_SECRET") ?? "LogiFlowSuperSecretKeyForDevelopment1234567890!");

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

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Automatically apply EF Core migrations on startup if database exists/configured
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Database.Migrate();
    }
}
catch
{
    // Ignore migration exception when database server is offline during build or mock test runs
}

// Register global exception handling middleware
app.UseMiddleware<ExceptionMiddleware>();

// Enable Swagger and Swagger UI unconditionally for local exposure at /swagger
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "LogiFlow API v1");
    options.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program;
