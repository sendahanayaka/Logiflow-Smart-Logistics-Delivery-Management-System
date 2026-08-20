using System.Security.Claims;
using LogiFlow.Api.DTOs.Auth;
using LogiFlow.Api.DTOs.Users;
using LogiFlow.Application.Common;
using LogiFlow.Application.Users;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.OperationsManager))]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] UserStatus? status,
        [FromQuery] UserSortBy sortBy = UserSortBy.CreatedAt,
        [FromQuery] SortDirection sortDirection = SortDirection.Desc,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _userService.GetUsersAsync(
            new UserQuery(
                search,
                role,
                status,
                sortBy,
                sortDirection,
                page,
                pageSize),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return Failure(result.Error);
        }

        var users = result.Value!;
        var response = new PagedResult<UserResponse>(
            users.Items.Select(ToResponse).ToArray(),
            users.Page,
            users.PageSize,
            users.TotalCount);

        return Ok(ApiResponse<PagedResult<UserResponse>>.Ok(response));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _userService.GetByIdAsync(id, cancellationToken);

        return result.IsSuccess
            ? Ok(ApiResponse<UserResponse>.Ok(ToResponse(result.Value!)))
            : Failure(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.CreateAsync(
            new CreateUserCommand(
                request.FullName,
                request.Email,
                request.PhoneNumber,
                request.Password,
                request.Role),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return Failure(result.Error);
        }

        var response = ToResponse(result.Value!);

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Id },
            ApiResponse<UserResponse>.Ok(response, "User created."));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateAsync(
            id,
            new UpdateUserCommand(
                request.FullName,
                request.Email,
                request.PhoneNumber),
            cancellationToken);

        return result.IsSuccess
            ? Ok(ApiResponse<UserResponse>.Ok(
                ToResponse(result.Value!),
                "User updated."))
            : Failure(result.Error);
    }

    [HttpPatch("{id:guid}/role")]
    public async Task<IActionResult> ChangeRole(
        Guid id,
        UpdateUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentManagerId(out var currentManagerId))
        {
            return Unauthorized();
        }

        var result = await _userService.ChangeRoleAsync(
            id,
            request.Role,
            currentManagerId,
            cancellationToken);

        return result.IsSuccess
            ? Ok(ApiResponse<UserResponse>.Ok(
                ToResponse(result.Value!),
                "User role updated."))
            : Failure(result.Error);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(
        Guid id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentManagerId(out var currentManagerId))
        {
            return Unauthorized();
        }

        var result = await _userService.ChangeStatusAsync(
            id,
            request.Status,
            currentManagerId,
            cancellationToken);

        return result.IsSuccess
            ? Ok(ApiResponse<UserResponse>.Ok(
                ToResponse(result.Value!),
                "User status updated."))
            : Failure(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentManagerId(out var currentManagerId))
        {
            return Unauthorized();
        }

        var result = await _userService.DeactivateAsync(
            id,
            currentManagerId,
            cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : Failure(result.Error);
    }

    private bool TryGetCurrentManagerId(out Guid userId)
    {
        return Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }

    private IActionResult Failure(ResultError? error)
    {
        if (error is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        var statusCode = error.Type switch
        {
            ResultErrorType.Validation => StatusCodes.Status400BadRequest,
            ResultErrorType.NotFound => StatusCodes.Status404NotFound,
            ResultErrorType.Conflict => StatusCodes.Status409Conflict,
            ResultErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status400BadRequest
        };

        return StatusCode(
            statusCode,
            ApiResponse<object>.Failure(error.Message, error.Details));
    }

    private static UserResponse ToResponse(User user)
    {
        return new UserResponse(
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.Status,
            user.CreatedAt,
            user.UpdatedAt);
    }
}
