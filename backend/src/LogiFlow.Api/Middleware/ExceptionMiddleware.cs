using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LogiFlow.Api.Middleware;

public sealed class ExceptionMiddleware
{
    private static readonly HashSet<string> ConflictSqlStates = new(StringComparer.Ordinal)
    {
        PostgresErrorCodes.UniqueViolation,
        PostgresErrorCodes.SerializationFailure,
        PostgresErrorCodes.CheckViolation
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware>? logger = null,
        IHostEnvironment? env = null)
    {
        _next = next;
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<ExceptionMiddleware>.Instance;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            _logger?.LogError(
                exception,
                "An unhandled exception occurred processing request {Path}",
                context.Request.Path);

            var isConflict = IsExpectedConflict(exception);

            if (isConflict)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict",
                    Detail = "The requested operation conflicts with the current warehouse data. Please retry or revise the request."
                };

                context.Response.Clear();
                context.Response.StatusCode = problem.Status.Value;
                await context.Response.WriteAsJsonAsync(problem);

                return;
            }

            await HandleExceptionAsync(context, exception);
        }
    }

    private Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            KeyNotFoundException => HttpStatusCode.NotFound,
            ArgumentException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status = context.Response.StatusCode,
            message = exception.Message,
            detail = (_env?.IsDevelopment() ?? false)
                ? exception.StackTrace
                : exception.InnerException?.Message
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        return context.Response.WriteAsync(
            JsonSerializer.Serialize(response, options));
    }

    private static bool IsExpectedConflict(Exception exception)
    {
        if (exception is DbUpdateConcurrencyException)
        {
            return true;
        }

        var postgresException = FindPostgresException(exception);

        return postgresException is not null &&
               ConflictSqlStates.Contains(postgresException.SqlState);
    }

    private static PostgresException? FindPostgresException(
        Exception exception)
    {
        for (
            Exception? current = exception;
            current is not null;
            current = current.InnerException)
        {
            if (current is PostgresException postgresException)
            {
                return postgresException;
            }
        }

        return null;
    }
}