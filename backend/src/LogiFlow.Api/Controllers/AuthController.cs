using LogiFlow.Application.Auth.DTOs;
using LogiFlow.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { Message = "Invalid email or password." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            
            // Fallback for JWT specific claims if standard is absent
            if (string.IsNullOrEmpty(email))
                email = User.FindFirstValue("email");

            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { Message = "Invalid token claims." });

            var user = await _authService.GetCurrentUserAsync(email);
            return Ok(user);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { Message = "User not found or inactive." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred." });
        }
    }
}
