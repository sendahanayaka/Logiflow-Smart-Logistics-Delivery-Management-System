using FluentValidation;
using LogiFlow.Api.DTOs.Warehouse;

namespace LogiFlow.Api.Validators.Warehouse;

public sealed class CreateStorageZoneRequestValidator : AbstractValidator<CreateStorageZoneRequest>
{
    public CreateStorageZoneRequestValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(request => request.Code)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(request => request.TotalVolumeM3)
            .GreaterThan(0);
    }
}
