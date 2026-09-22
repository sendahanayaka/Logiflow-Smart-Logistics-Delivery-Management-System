using FluentValidation;
using LogiFlow.Api.DTOs.Warehouse;

namespace LogiFlow.Api.Validators.Warehouse;

public sealed class CreatePackageRequestValidator : AbstractValidator<CreatePackageRequest>
{
    public CreatePackageRequestValidator()
    {
        RuleFor(request => request.OrderId)
            .NotEqual(Guid.Empty);

        RuleFor(request => request.WarehouseId)
            .NotEqual(Guid.Empty);

        RuleFor(request => request.StorageZoneId)
            .NotEqual(Guid.Empty);

        RuleFor(request => request.TrackingCode)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.WeightKg)
            .GreaterThan(0);

        RuleFor(request => request.VolumeM3)
            .GreaterThan(0);

        RuleFor(request => request.SpecialHandling)
            .MaximumLength(500)
            .When(request => request.SpecialHandling is not null);
    }
}
