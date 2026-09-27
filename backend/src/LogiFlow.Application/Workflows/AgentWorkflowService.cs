// [S4]  agent workflow service
using System.Globalization;
using System.Text.Json;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using LogiFlow.Application.Workflows.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LogiFlow.Application.Workflows;

public class AgentWorkflowService : IAgentWorkflowService
{
    private readonly IAppDbContext _context;
    private readonly IAgentServiceClient _agent;
    private readonly ILogger<AgentWorkflowService> _logger;

    public AgentWorkflowService(
        IAppDbContext context,
        IAgentServiceClient agent,
        ILogger<AgentWorkflowService> logger)
    {
        _context = context;
        _agent = agent;
        _logger = logger;
    }

    public async Task<WorkflowResponse> RunWorkflowAsync(
        RunWorkflowCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidateCommand(command);

        // The backend owns the correlation id (agent thread id + our WorkflowKey).
        var workflowKey = $"wf-{Guid.NewGuid():N}"[..15];
        var payload = BuildPayload(workflowKey, command);

        AgentRunResponse response;
        try
        {
            response = await _agent.RunAsync(payload, cancellationToken);
        }
        catch (AgentServiceException exception)
        {
            // Record the failed attempt so nothing is silently lost, then surface it.
            var failed = new AgentWorkflow
            {
                Id = Guid.NewGuid(),
                WorkflowKey = workflowKey,
                DispatchBatchId = command.DispatchBatchId,
                Status = WorkflowStatus.Failed,
                Objective = command.Objective,
                Error = Truncate(exception.Message, 2000),
                CreatedAt = DateTime.UtcNow
            };
            _context.AgentWorkflows.Add(failed);
            await _context.SaveChangesAsync(cancellationToken);
            throw;
        }

        var status = MapStatus(response.Status);
        var routing = response.Proposal?.Routing;

        var workflow = new AgentWorkflow
        {
            Id = Guid.NewGuid(),
            WorkflowKey = string.IsNullOrWhiteSpace(response.WorkflowId) ? workflowKey : response.WorkflowId,
            DispatchBatchId = command.DispatchBatchId,
            Status = status,
            Objective = command.Objective,
            Summary = ExtractSummary(response.Audit),
            ProposedPlanJson = routing is null ? null : JsonSerializer.Serialize(routing),
            AuditJson = response.Audit is null ? null : JsonSerializer.Serialize(response.Audit),
            Error = status == WorkflowStatus.Failed ? ExtractError(response.Errors) : null,
            CreatedAt = DateTime.UtcNow
        };

        AttachRouteStops(workflow, routing, command);
        ApplyServerSideValidation(workflow);

        _context.AgentWorkflows.Add(workflow);
        await _context.SaveChangesAsync(cancellationToken);

        return Map(workflow);
    }

    public async Task<WorkflowResponse?> GetWorkflowAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var workflow = await _context.AgentWorkflows
            .AsNoTracking()
            .Include(item => item.RouteStops)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return workflow is null ? null : Map(workflow);
    }

    // --- payload assembly ----------------------------------------------------

    private static AgentRunPayload BuildPayload(string workflowKey, RunWorkflowCommand command)
    {
        var orderIds = command.Stops
            .Select(stop => stop.OrderId.ToString())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var stops = command.Stops
            .Select(stop => new AgentStop(
                stop.StopKey,
                stop.OrderId.ToString(),
                stop.Address,
                stop.Latitude,
                stop.Longitude,
                ToIso(stop.WindowStart),
                ToIso(stop.WindowEnd)))
            .ToList();

        return new AgentRunPayload(
            workflowKey,
            command.Objective ?? string.Empty,
            ToIso(command.DeliveryWindowStart),
            command.CustomerNotes,
            orderIds,
            stops);
    }

    private static void AttachRouteStops(
        AgentWorkflow workflow,
        AgentRoutingOutput? routing,
        RunWorkflowCommand command)
    {
        if (routing is null)
        {
            return;
        }

        // The agent returns only {sequence, stop_id, eta, distance}; enrich each with
        // the original address/coordinates/windows from the request (matched by key).
        var source = command.Stops.ToDictionary(stop => stop.StopKey, StringComparer.OrdinalIgnoreCase);

        foreach (var sequenced in routing.SequencedStops.OrderBy(item => item.Sequence))
        {
            source.TryGetValue(sequenced.StopId, out var original);

            workflow.RouteStops.Add(new RouteStop
            {
                Id = Guid.NewGuid(),
                StopKey = sequenced.StopId,
                OrderId = original?.OrderId ?? Guid.Empty,
                Sequence = sequenced.Sequence,
                Address = original?.Address ?? string.Empty,
                Latitude = original?.Latitude ?? 0,
                Longitude = original?.Longitude ?? 0,
                DistanceFromPrevKm = (decimal)sequenced.DistanceFromPrevKm,
                Eta = ParseIsoAsUtc(sequenced.Eta),
                WindowStart = AsUtc(original?.WindowStart),
                WindowEnd = AsUtc(original?.WindowEnd),
                OnTime = null, // authoritative feasibility comes from the EtaEngine (Phase 3)
                Status = RouteStopStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    // Deterministic re-check of the agent's plan: set the authoritative on-time flag
    // from each stop's ETA vs its window, and re-validate the numbers against physics.
    // "The agent proposes; the backend decides."
    private void ApplyServerSideValidation(AgentWorkflow workflow)
    {
        var stops = workflow.RouteStops.OrderBy(stop => stop.Sequence).ToList();
        if (stops.Count == 0)
        {
            return;
        }

        foreach (var stop in stops)
        {
            stop.OnTime = EtaEngine.WithinWindow(stop.Eta, stop.WindowStart, stop.WindowEnd);
        }

        var etaStops = stops
            .Select(stop => new EtaStop(
                stop.StopKey, stop.Latitude, stop.Longitude,
                (double)stop.DistanceFromPrevKm, stop.WindowStart, stop.WindowEnd))
            .ToList();
        var validation = EtaEngine.ValidatePlan(etaStops, stops.Select(stop => stop.Eta).ToList());

        if (!validation.Ok)
        {
            _logger.LogWarning(
                "Workflow {WorkflowKey}: agent plan failed re-validation: {Issues}",
                workflow.WorkflowKey, string.Join("; ", validation.Issues));
        }

        if (validation.Warnings.Count > 0)
        {
            _logger.LogInformation(
                "Workflow {WorkflowKey}: re-validation warnings: {Warnings}",
                workflow.WorkflowKey, string.Join("; ", validation.Warnings));
        }
    }

    // --- mapping helpers -----------------------------------------------------

    private static WorkflowResponse Map(AgentWorkflow workflow)
    {
        var stops = workflow.RouteStops
            .OrderBy(stop => stop.Sequence)
            .Select(stop => new RouteStopResponse(
                stop.Id,
                stop.Sequence,
                stop.StopKey,
                stop.OrderId,
                stop.Address,
                stop.Latitude,
                stop.Longitude,
                stop.DistanceFromPrevKm,
                stop.Eta,
                stop.WindowStart,
                stop.WindowEnd,
                stop.OnTime,
                stop.Status.ToString()))
            .ToList();

        return new WorkflowResponse(
            workflow.Id,
            workflow.WorkflowKey,
            workflow.DispatchBatchId,
            workflow.Status.ToString(),
            workflow.Objective,
            workflow.Summary,
            stops.Sum(stop => stop.DistanceFromPrevKm),
            stops.Count,
            workflow.CreatedAt,
            stops);
    }

    private static WorkflowStatus MapStatus(string? agentStatus) => agentStatus switch
    {
        "AWAITING_APPROVAL" => WorkflowStatus.AwaitingApproval,
        "APPROVED" => WorkflowStatus.Approved,
        "REJECTED" => WorkflowStatus.Rejected,
        "COMPLETED" or "EXECUTING" => WorkflowStatus.Completed,
        "FAILED" => WorkflowStatus.Failed,
        "PENDING" => WorkflowStatus.Pending,
        null => WorkflowStatus.Pending,
        _ => WorkflowStatus.Planning // PLANNING / ALLOCATING / VALIDATING / ROUTING
    };

    private static string? ExtractSummary(IReadOnlyList<AgentAuditEntry>? audit)
    {
        if (audit is null || audit.Count == 0)
        {
            return null;
        }

        var routeStep = audit.FirstOrDefault(entry =>
            string.Equals(entry.Step, "route", StringComparison.OrdinalIgnoreCase));
        return (routeStep ?? audit[^1]).Summary;
    }

    private static string? ExtractError(IReadOnlyList<AgentError>? errors)
    {
        if (errors is null || errors.Count == 0)
        {
            return null;
        }

        return Truncate(string.Join("; ", errors.Select(error => $"{error.Step}: {error.Message}")), 2000);
    }

    // --- validation + primitives ---------------------------------------------

    private static void ValidateCommand(RunWorkflowCommand command)
    {
        if (command.DispatchBatchId == Guid.Empty)
        {
            throw new ArgumentException("Dispatch batch ID is required.", nameof(command.DispatchBatchId));
        }

        if (command.Stops is null || command.Stops.Count == 0)
        {
            throw new ArgumentException("At least one stop is required.", nameof(command.Stops));
        }

        foreach (var stop in command.Stops)
        {
            if (string.IsNullOrWhiteSpace(stop.StopKey))
            {
                throw new ArgumentException("Every stop needs a stop key.", nameof(command.Stops));
            }

            if (stop.OrderId == Guid.Empty)
            {
                throw new ArgumentException($"Stop '{stop.StopKey}' is missing an order ID.", nameof(command.Stops));
            }
        }
    }

    private static string? ToIso(DateTime? value) =>
        value?.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);

    // The delivery window / ETA times are single-timezone wall-clock values. Normalise
    // to UTC Kind so Npgsql accepts them for timestamptz columns; the EtaEngine (Phase 3)
    // owns authoritative timezone semantics.
    private static DateTime ParseIsoAsUtc(string value)
    {
        var parsed = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
        return AsUtcValue(parsed);
    }

    private static DateTime? AsUtc(DateTime? value) => value is null ? null : AsUtcValue(value.Value);

    private static DateTime AsUtcValue(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
