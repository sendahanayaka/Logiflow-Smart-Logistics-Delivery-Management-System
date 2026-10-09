using FluentValidation;
using LogiFlow.Api.DTOs.Orders;
using LogiFlow.Domain.Enums;
using System;

namespace LogiFlow.Api.Validators;

public class CreateDeliveryOrderRequestValidator : AbstractValidator<CreateDeliveryOrderRequest>
{
    public CreateDeliveryOrderRequestValidator()
    {
        RuleFor(x => x.PickupAddress)
            .NotEmpty().WithMessage("Pickup address is required.")
            .MaximumLength(500).WithMessage("Pickup address cannot exceed 500 characters.");

        RuleFor(x => x.PickupCity)
            .NotEmpty().WithMessage("Pickup city is required.")
            .MaximumLength(100).WithMessage("Pickup city cannot exceed 100 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(500).WithMessage("Delivery address cannot exceed 500 characters.");

        RuleFor(x => x.DeliveryCity)
            .NotEmpty().WithMessage("Delivery city is required.")
            .MaximumLength(100).WithMessage("Delivery city cannot exceed 100 characters.");

        RuleFor(x => x.PackageDescription)
            .NotEmpty().WithMessage("Package description is required.")
            .MaximumLength(500).WithMessage("Package description cannot exceed 500 characters.");

        RuleFor(x => x.PreferredPickupDate)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Preferred pickup date cannot be in the past.");

        RuleFor(x => x.WeightKg)
            .GreaterThan(0).WithMessage("Weight must be greater than zero.");

        RuleFor(x => x.LengthCm)
            .GreaterThan(0).WithMessage("Length must be greater than zero.");

        RuleFor(x => x.WidthCm)
            .GreaterThan(0).WithMessage("Width must be greater than zero.");

        RuleFor(x => x.HeightCm)
            .GreaterThan(0).WithMessage("Height must be greater than zero.");

        RuleFor(x => x.Priority)
            .Must(BeAValidPriority).WithMessage("Priority must be a valid DeliveryPriority value.");

        // Recipient details are mandatory: a delivery must have someone to receive it.
        RuleFor(x => x.RecipientName)
            .NotEmpty().WithMessage("Recipient name is required.")
            .MaximumLength(255).WithMessage("Recipient name cannot exceed 255 characters.");

        RuleFor(x => x.RecipientContact)
            .NotEmpty().WithMessage("Recipient contact is required.")
            .Matches(@"^\d{10}$").WithMessage("Recipient contact must be a 10-digit phone number.");
    }

    private bool BeAValidPriority(string priority)
    {
        return Enum.TryParse<DeliveryPriority>(priority, true, out _);
    }
}
