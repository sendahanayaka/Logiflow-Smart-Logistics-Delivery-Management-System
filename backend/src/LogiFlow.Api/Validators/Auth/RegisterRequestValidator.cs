using FluentValidation;
using LogiFlow.Api.DTOs.Auth;

namespace LogiFlow.Api.Validators.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(request => request.PhoneNumber)
            .NotEmpty()
            .MaximumLength(32)
            .Matches(@"^\+?[0-9][0-9\s().-]{6,30}$")
            .WithMessage("PhoneNumber must be a valid phone number.");

        RuleFor(request => request.Password)
            .NotEmpty();

        RuleFor(request => request.ConfirmPassword)
            .NotEmpty()
            .Equal(request => request.Password)
            .WithMessage("ConfirmPassword must match Password.");
    }
}
