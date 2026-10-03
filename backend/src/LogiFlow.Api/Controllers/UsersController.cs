// [ALL]  user administration
using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Users;
using LogiFlow.Application.Users;
using LogiFlow.Application.Users.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "ADMIN")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;
    private readonly IValidator<CreateUserRequest> _createValidator;

    public UsersController(IUserService users, IValidator<CreateUserRequest> createValidator)
    {
        _users = users;
        _createValidator = createValidator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UserResponse>>> List(CancellationToken cancellationToken) =>
        Ok(await _users.ListUsersAsync(cancellationToken));

    [HttpGet("roles")]
    [ProducesResponseType(typeof(IReadOnlyList<RoleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RoleResponse>>> Roles(CancellationToken cancellationToken) =>
        Ok(await _users.ListRolesAsync(cancellationToken));

    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserResponse>> Create(
        [FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var validation = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationFailure(validation);
        }

        try
        {
            var user = await _users.CreateUserAsync(
                new CreateUserCommand(request.Name, request.Email, request.Password, request.RoleId),
                cancellationToken);
            return CreatedAtAction(nameof(List), new { id = user.Id }, user);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/role")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> ChangeRole(
        Guid id, [FromBody] ChangeRoleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _users.ChangeRoleAsync(id, new ChangeRoleCommand(request.RoleId), cancellationToken));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> SetStatus(
        Guid id, [FromBody] SetUserStatusRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _users.SetStatusAsync(id, new SetUserStatusCommand(request.IsActive), cancellationToken));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    private ActionResult ValidationFailure(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray());
        return BadRequest(new ValidationProblemDetails(errors));
    }
}
