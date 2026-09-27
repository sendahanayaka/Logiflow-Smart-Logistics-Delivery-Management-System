using FluentValidation;
using LogiFlow.Api.DTOs.Warehouse;

namespace LogiFlow.Api.Validators.Warehouse;

public sealed class CreateDispatchBatchRequestValidator : AbstractValidator<CreateDispatchBatchRequest>
{
    public CreateDispatchBatchRequestValidator()
    {
        RuleFor(request => request.WarehouseId)
            .NotEqual(Guid.Empty);

        RuleFor(request => request.VehicleId)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.MaxWeightKg)
            .GreaterThan(0);

        RuleFor(request => request.MaxVolumeM3)
            .GreaterThan(0);

        RuleFor(request => request.PackageIds)
            .NotNull()
            .NotEmpty()
            .Must(packageIds => packageIds.All(packageId => packageId != Guid.Empty))
            .WithMessage("Package IDs must not contain an empty value.")
            .Must(packageIds => packageIds.Distinct().Count() == packageIds.Count)
            .WithMessage("Package IDs must be unique.");
    }
}
