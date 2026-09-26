using FluentValidation;
using LogiFlow.Api.Controllers;
using LogiFlow.Api.Middleware;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Workflows;
using LogiFlow.Infrastructure.Agents;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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
app.MapControllers();
app.Run();

public partial class Program;
