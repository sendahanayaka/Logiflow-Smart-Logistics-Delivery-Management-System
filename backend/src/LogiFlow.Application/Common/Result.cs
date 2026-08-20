namespace LogiFlow.Application.Common;

public enum ResultErrorType
{
    Validation,
    NotFound,
    Conflict,
    Forbidden
}

public sealed record ResultError(
    string Code,
    string Message,
    ResultErrorType Type,
    IReadOnlyCollection<string>? Details = null);

public sealed record Result(
    bool IsSuccess,
    ResultError? Error)
{
    public static Result Success() => new(true, null);

    public static Result Failure(ResultError error) => new(false, error);
}

public sealed record Result<T>(
    bool IsSuccess,
    T? Value,
    ResultError? Error)
{
    public static Result<T> Success(T value) => new(true, value, null);

    public static Result<T> Failure(ResultError error) =>
        new(false, default, error);
}
