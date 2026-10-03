using System;

namespace LogiFlow.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
}
