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

        RuleFor(x => x.RecipientContact)
            .MinimumLength(3).WithMessage("Recipient contact format is invalid.")
            .When(x => !string.IsNullOrWhiteSpace(x.RecipientContact));
    }

    private bool BeAValidPriority(string priority)
    {
        return Enum.TryParse<DeliveryPriority>(priority, true, out _);
    }
}
