using FluentValidation;
using LogiFlow.Api.DTOs.Workflows;

namespace LogiFlow.Api.Validators.Workflows;

public class TriggerWorkflowRequestValidator : AbstractValidator<TriggerWorkflowRequest>
{
    public TriggerWorkflowRequestValidator()
    {
        RuleFor(request => request.DispatchBatchId)
            .NotEmpty().WithMessage("Dispatch batch ID is required.");

        RuleFor(request => request.Stops)
            .NotEmpty().WithMessage("At least one stop is required.");

        RuleForEach(request => request.Stops).ChildRules(stop =>
        {
            stop.RuleFor(item => item.StopKey)
                .NotEmpty().WithMessage("Stop key is required.")
                .MaximumLength(100);

            stop.RuleFor(item => item.OrderId)
                .NotEmpty().WithMessage("Order ID is required.");

            stop.RuleFor(item => item.Address)
                .NotEmpty().WithMessage("Address is required.")
                .MaximumLength(500);

            stop.RuleFor(item => item.Latitude)
                .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90.");

            stop.RuleFor(item => item.Longitude)
                .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180.");
        });
    }
}
