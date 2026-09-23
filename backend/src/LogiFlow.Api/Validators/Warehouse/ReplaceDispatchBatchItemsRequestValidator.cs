using FluentValidation;
using LogiFlow.Api.DTOs.Warehouse;

namespace LogiFlow.Api.Validators.Warehouse;

public sealed class ReplaceDispatchBatchItemsRequestValidator
    : AbstractValidator<ReplaceDispatchBatchItemsRequest>
{
    public ReplaceDispatchBatchItemsRequestValidator()
    {
        RuleFor(request => request.PackageIds)
            .NotNull()
            .NotEmpty()
            .Must(packageIds => packageIds.All(packageId => packageId != Guid.Empty))
            .WithMessage("Package IDs must not contain an empty value.")
            .Must(packageIds => packageIds.Distinct().Count() == packageIds.Count)
            .WithMessage("Package IDs must be unique.");
    }
}
