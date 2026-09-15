using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.Configuration;
using LogiFlow.Api.DTOs.Auth;
using LogiFlow.Application.Auth;
using LogiFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private const string RefreshCookieName = "logiflow.refresh";

    private readonly IAuthService _authService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly RefreshCookieOptions _refreshCookieOptions;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        RefreshCookieOptions refreshCookieOptions)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _refreshCookieOptions = refreshCookieOptions;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _registerValidator.ValidateAsync(
            request,
            cancellationToken);

        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        var result = await _authService.RegisterAsync(
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.Password,
            cancellationToken);

        if (result.Succeeded)
        {
            return StatusCode(
                StatusCodes.Status201Created,
                ToResponse(result.User!));
        }

        if (result.Failure == AuthFailure.DuplicateEmail)
        {
            return Conflict(CreateProblem(
                StatusCodes.Status409Conflict,
                "Email already registered",
                result.Errors));
        }

        return BadRequest(CreateProblem(
            StatusCodes.Status400BadRequest,
            "Registration failed",
            result.Errors));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _loginValidator.ValidateAsync(
            request,
            cancellationToken);

        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        var result = await _authService.LoginAsync(
            request.Email,
            request.Password,
            cancellationToken);

        if (result.Succeeded)
        {
            SetRefreshCookie(result.RefreshToken!);

            return Ok(new LoginResponse(
                result.AccessToken!,
                result.ExpiresAt!.Value,
                ToResponse(result.User!)));
        }

        if (result.Failure == AuthFailure.InactiveAccount)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                CreateProblem(
                    StatusCodes.Status403Forbidden,
                    "Account inactive"));
        }

        if (result.Failure == AuthFailure.SuspendedAccount)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                CreateProblem(
                    StatusCodes.Status403Forbidden,
                    "Account suspended"));
        }

        return Unauthorized(CreateProblem(
            StatusCodes.Status401Unauthorized,
            "Invalid email or password"));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(
                RefreshCookieName,
                out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            ClearRefreshCookie();
            return Unauthorized(CreateProblem(
                StatusCodes.Status401Unauthorized,
                "Invalid refresh session"));
        }

        var result = await _authService.RefreshAsync(
            refreshToken,
            cancellationToken);

        if (!result.Succeeded)
        {
            ClearRefreshCookie();
            return Unauthorized(CreateProblem(
                StatusCodes.Status401Unauthorized,
                "Invalid refresh session"));
        }

        SetRefreshCookie(result.RefreshToken!);

        return Ok(new LoginResponse(
            result.AccessToken!,
            result.ExpiresAt!.Value,
            ToResponse(result.User!)));
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(
            RefreshCookieName,
            out var refreshToken);

        await _authService.RevokeRefreshTokenAsync(
            refreshToken,
            cancellationToken);
        ClearRefreshCookie();

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(
        CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(
            userId,
            cancellationToken);

        return user is null
            ? Unauthorized()
            : Ok(ToResponse(user));
    }

    private IActionResult ValidationFailure(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray());

        return BadRequest(new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred."
        });
    }

    private static ProblemDetails CreateProblem(
        int status,
        string title,
        IReadOnlyCollection<string>? errors = null)
    {
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title
        };

        if (errors is { Count: > 0 })
        {
            problem.Extensions["errors"] = errors;
        }

        return problem;
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

    private void SetRefreshCookie(IssuedRefreshToken refreshToken)
    {
        Response.Cookies.Append(
            RefreshCookieName,
            refreshToken.Value,
            CookieOptions(refreshToken.ExpiresAt));
    }

    private void ClearRefreshCookie()
    {
        Response.Cookies.Delete(
            RefreshCookieName,
            CookieOptions(DateTimeOffset.UnixEpoch));
    }

    private CookieOptions CookieOptions(DateTimeOffset expiresAt)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/api/auth",
            Secure = _refreshCookieOptions.Secure,
            IsEssential = true,
            Expires = expiresAt
        };
    }
}
