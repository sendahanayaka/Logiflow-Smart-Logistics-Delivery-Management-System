using FluentValidation;
using LogiFlow.Api.DTOs.Workflows;

namespace LogiFlow.Api.Validators.Workflows;

public class ApproveWorkflowRequestValidator : AbstractValidator<ApproveWorkflowRequest>
{
    private static readonly string[] AllowedActions = { "APPROVE", "REJECT", "REVISE" };

    public ApproveWorkflowRequestValidator()
    {
        RuleFor(request => request.Action)
            .NotEmpty()
            .Must(action => AllowedActions.Contains(action?.Trim().ToUpperInvariant()))
            .WithMessage("Action must be APPROVE, REJECT or REVISE.");

        RuleFor(request => request.DecidedBy)
            .NotEmpty().WithMessage("DecidedBy is required.")
            .MaximumLength(200);

        // A dispatch needs a driver + vehicle.
        When(request => string.Equals(request.Action?.Trim(), "APPROVE", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(request => request.DriverId)
                .NotNull().Must(id => id != Guid.Empty).WithMessage("DriverId is required to approve.");
            RuleFor(request => request.VehicleId)
                .NotNull().Must(id => id != Guid.Empty).WithMessage("VehicleId is required to approve.");
        });
    }
}
