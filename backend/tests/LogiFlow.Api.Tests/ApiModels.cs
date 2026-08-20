using System.Text.Json;

namespace LogiFlow.Api.Tests;

internal static class ApiJson
{
    public static readonly JsonSerializerOptions Options = new(
        JsonSerializerDefaults.Web);
}

internal sealed record TestUserResponse(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string Role,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

internal sealed record TestLoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    TestUserResponse User);

internal sealed record TestApiResponse<T>(
    bool Success,
    T? Data,
    string? Message,
    IReadOnlyCollection<string>? Errors);

internal sealed record TestPagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
