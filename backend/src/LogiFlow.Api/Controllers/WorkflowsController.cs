// [S4]  start/status/approval/summary
using FluentValidation;
using FluentValidation.Results;
using LogiFlow.Api.DTOs.Workflows;
using LogiFlow.Application.Workflows;
using LogiFlow.Application.Workflows.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Route("api/workflows")]
public class WorkflowsController : ControllerBase
{
    private readonly IAgentWorkflowService _workflows;
    private readonly IValidator<TriggerWorkflowRequest> _triggerValidator;

    public WorkflowsController(
        IAgentWorkflowService workflows,
        IValidator<TriggerWorkflowRequest> triggerValidator)
    {
        _workflows = workflows;
        _triggerValidator = triggerValidator;
    }

    // TODO(S1-auth): restrict to Operations Manager once authentication is wired.
    [HttpPost]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<WorkflowResponse>> Trigger(
        [FromBody] TriggerWorkflowRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _triggerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ValidationFailure(validationResult);
        }

        var command = new RunWorkflowCommand(
            request.DispatchBatchId,
            request.Objective,
            request.DeliveryWindowStart,
            request.CustomerNotes,
            request.Stops
                .Select(stop => new RunWorkflowStop(
                    stop.StopKey,
                    stop.OrderId,
                    stop.Address,
                    stop.Latitude,
                    stop.Longitude,
                    stop.WindowStart,
                    stop.WindowEnd))
                .ToList());

        try
        {
            var workflow = await _workflows.RunWorkflowAsync(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = workflow.Id }, workflow);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (AgentServiceException exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = exception.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var workflow = await _workflows.GetWorkflowAsync(id, cancellationToken);
        return workflow is null ? NotFound() : Ok(workflow);
    }

    private ActionResult ValidationFailure(ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray());

        return BadRequest(new ValidationProblemDetails(errors));
    }
}
