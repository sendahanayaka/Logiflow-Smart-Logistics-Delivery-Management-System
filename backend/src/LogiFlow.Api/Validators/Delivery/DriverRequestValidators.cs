using FluentValidation;
using LogiFlow.Api.DTOs.Delivery;

namespace LogiFlow.Api.Validators.Delivery;

public class RecordStopEventRequestValidator : AbstractValidator<RecordStopEventRequest>
{
    private static readonly string[] AllowedKinds = { "ARRIVED", "DEPARTED" };

    public RecordStopEventRequestValidator()
    {
        RuleFor(request => request.StopKey)
            .NotEmpty().WithMessage("StopKey is required.")
            .MaximumLength(100);

        RuleFor(request => request.Kind)
            .NotEmpty()
            .Must(kind => AllowedKinds.Contains(kind?.Trim().ToUpperInvariant()))
            .WithMessage("Kind must be ARRIVED or DEPARTED.");

        RuleFor(request => request.Latitude)
            .InclusiveBetween(-90, 90).When(request => request.Latitude is not null);
        RuleFor(request => request.Longitude)
            .InclusiveBetween(-180, 180).When(request => request.Longitude is not null);
    }
}

public class RecordPodRequestValidator : AbstractValidator<RecordPodRequest>
{
    public RecordPodRequestValidator()
    {
        RuleFor(request => request.StopKey)
            .NotEmpty().WithMessage("StopKey is required.")
            .MaximumLength(100);
    }
}
