using FluentValidation;
using LogiFlow.Api.DTOs.Warehouse;

namespace LogiFlow.Api.Validators.Warehouse;

public sealed class UpdatePackageRequestValidator : AbstractValidator<UpdatePackageRequest>
{
    public UpdatePackageRequestValidator()
    {
        RuleFor(request => request.StorageZoneId)
            .NotEmpty().WithMessage("A storage zone is required.");

        RuleFor(request => request.WeightKg)
            .GreaterThan(0);

        RuleFor(request => request.VolumeM3)
            .GreaterThan(0);

        RuleFor(request => request.SpecialHandling)
            .MaximumLength(500)
            .When(request => request.SpecialHandling is not null);
    }
}
