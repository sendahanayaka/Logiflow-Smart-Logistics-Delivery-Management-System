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

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            var isConflict = IsExpectedConflict(exception);
            var problem = new ProblemDetails
            {
                Status = isConflict
                    ? StatusCodes.Status409Conflict
                    : StatusCodes.Status500InternalServerError,
                Title = isConflict ? "Conflict" : "An unexpected error occurred.",
                Detail = isConflict
                    ? "The requested operation conflicts with the current warehouse data. Please retry or revise the request."
                    : "An unexpected server error occurred."
            };

            context.Response.Clear();
            context.Response.StatusCode = problem.Status.Value;
            await context.Response.WriteAsJsonAsync(problem);
        }
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

    private static PostgresException? FindPostgresException(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgresException)
            {
                return postgresException;
            }
        }

        return null;
    }
}
