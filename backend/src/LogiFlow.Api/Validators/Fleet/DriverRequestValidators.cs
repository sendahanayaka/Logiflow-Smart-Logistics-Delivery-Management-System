using System;
using FluentValidation;
using LogiFlow.Application.Fleet.DTOs;

namespace LogiFlow.Api.Validators.Fleet;

// Driver field rules: name is letters only, phone is exactly 10 digits, and the
// licence must stay valid for strictly more than one month from today.
public sealed class CreateDriverRequestValidator : AbstractValidator<CreateDriverRequest>
{
    public CreateDriverRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters.")
            .Matches(DriverValidationRules.NamePattern).WithMessage(DriverValidationRules.NameMessage);

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required.")
            .MaximumLength(50).WithMessage("License number cannot exceed 50 characters.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(DriverValidationRules.PhonePattern).WithMessage(DriverValidationRules.PhoneMessage);

        RuleFor(x => x.LicenseExpiryDate)
            .Must(DriverValidationRules.IsMoreThanOneMonthAway).WithMessage(DriverValidationRules.ExpiryMessage);
    }
}

public sealed class UpdateDriverRequestValidator : AbstractValidator<UpdateDriverRequest>
{
    public UpdateDriverRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters.")
            .Matches(DriverValidationRules.NamePattern).WithMessage(DriverValidationRules.NameMessage);

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required.")
            .MaximumLength(50).WithMessage("License number cannot exceed 50 characters.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(DriverValidationRules.PhonePattern).WithMessage(DriverValidationRules.PhoneMessage);

        RuleFor(x => x.LicenseExpiryDate)
            .Must(DriverValidationRules.IsMoreThanOneMonthAway).WithMessage(DriverValidationRules.ExpiryMessage);
    }
}

internal static class DriverValidationRules
{
    public const string NamePattern = @"^[A-Za-z][A-Za-z\s.'-]*$";
    public const string PhonePattern = @"^\d{10}$";
    public const string NameMessage = "Full name can only contain letters, spaces, apostrophes, hyphens, and dots.";
    public const string PhoneMessage = "Phone number must be exactly 10 digits.";
    public const string ExpiryMessage = "License expiry must be more than 1 month from today.";

    public static bool IsMoreThanOneMonthAway(DateTime expiry) =>
        expiry.Date > DateTime.UtcNow.Date.AddMonths(1);
}
