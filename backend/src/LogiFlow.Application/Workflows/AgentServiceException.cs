namespace LogiFlow.Application.Workflows;

/// <summary>
/// Raised when the internal agent service is unreachable or returns a non-success
/// response. Controllers map this to 502 Bad Gateway — it's an upstream failure, not
/// a client error.
/// </summary>
public sealed class AgentServiceException : Exception
{
    public int? StatusCode { get; }

    public AgentServiceException(string message, int? statusCode = null, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }
}
