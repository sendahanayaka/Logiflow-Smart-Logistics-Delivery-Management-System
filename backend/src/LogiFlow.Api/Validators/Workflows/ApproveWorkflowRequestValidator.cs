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

        // A dispatch needs a driver + vehicle, but they may come from the agent's
        // allocation (persisted on the workflow) rather than the request — so they are
        // optional here and the approval service falls back to the allocation. If the
        // approver DOES override, the ids must be non-empty.
        RuleFor(request => request.DriverId)
            .Must(id => id != Guid.Empty).When(request => request.DriverId is not null)
            .WithMessage("DriverId must be a valid id when provided.");
        RuleFor(request => request.VehicleId)
            .Must(id => id != Guid.Empty).When(request => request.VehicleId is not null)
            .WithMessage("VehicleId must be a valid id when provided.");
    }
}
