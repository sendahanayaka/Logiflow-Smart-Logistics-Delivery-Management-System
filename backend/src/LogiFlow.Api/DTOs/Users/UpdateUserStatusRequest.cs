using LogiFlow.Domain.Enums;

namespace LogiFlow.Api.DTOs.Users;

public sealed record UpdateUserStatusRequest(UserStatus Status);
