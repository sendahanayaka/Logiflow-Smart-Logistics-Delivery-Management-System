using FluentValidation;
using System;

namespace LogiFlow.Api.DTOs.Orders;

public class CreateDeliveryOrderRequestValidator : AbstractValidator<CreateDeliveryOrderRequest>
{
    public CreateDeliveryOrderRequestValidator()
    {
        RuleFor(x => x.PickupAddress).NotEmpty().MaximumLength(500);
        RuleFor(x => x.PickupCity).NotEmpty().MaximumLength(100);

        RuleFor(x => x.DeliveryAddress).NotEmpty().MaximumLength(500);
        RuleFor(x => x.DeliveryCity).NotEmpty().MaximumLength(100);

        RuleFor(x => x.PackageDescription).NotEmpty().MaximumLength(500);

        RuleFor(x => x.PreferredPickupDate).GreaterThanOrEqualTo(DateTime.UtcNow.Date);

        RuleFor(x => x.Priority).NotEmpty();

        RuleFor(x => x.WeightKg).GreaterThan(0);
        RuleFor(x => x.LengthCm).GreaterThan(0);
        RuleFor(x => x.WidthCm).GreaterThan(0);
        RuleFor(x => x.HeightCm).GreaterThan(0);

        RuleFor(x => x.SpecialHandling).MaximumLength(500);
        RuleFor(x => x.RecipientName).MaximumLength(255);
        RuleFor(x => x.RecipientContact).MaximumLength(100);

        When(x => !string.IsNullOrWhiteSpace(x.RecipientContact), () =>
        {
            RuleFor(x => x.RecipientContact).MinimumLength(3);
        });
    }
}
