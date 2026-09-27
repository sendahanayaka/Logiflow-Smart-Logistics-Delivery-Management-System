using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Api.Controllers;
using LogiFlow.Api.DTOs.Warehouse;
using LogiFlow.Application.Agents;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LogiFlow.UnitTests.Warehouse;

public sealed class DispatchAgentValidationControllerTests
{
    private static readonly Guid BatchId = Guid.Parse("6f61b179-6e1a-495f-a420-23b91c9e85b7");
    private static readonly Guid WarehouseId = Guid.Parse("35bbf8cf-b160-4821-b405-e18879d12d6e");
    private static readonly Guid OrderId = Guid.Parse("f7e4050c-5b23-46bc-bddf-4048e3543d4a");

    [Fact]
    public async Task ValidateWithAgent_ReturnsMatchingAgentExplanationWithoutChangingBackendDecision()
    {
        var agent = new StubAgentValidationClient(new AgentDispatchValidationResult(
            "s3-dispatch-validation",
            "PASS",
            new[] { new AgentValidationRuleResult("within_weight_capacity", true, "Within capacity.") },
            "The batch is safe to dispatch.",
            "ollama",
            Array.Empty<string>()));
        var controller = new DispatchAgentValidationController(new StubDispatchBatchService(), agent);

        var action = await controller.ValidateWithAgent(BatchId, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var payload = Assert.IsType<DispatchAgentValidationResponse>(result.Value);
        Assert.Equal("PASS", payload.DeterministicResult);
        Assert.True(payload.AgentAvailable);
        Assert.True(payload.AgentConsistent);
        Assert.Equal("The batch is safe to dispatch.", payload.Explanation);
        Assert.Equal(new[] { OrderId }, agent.Request!.OrderIds);
        Assert.Equal("VEH-001", agent.Request.VehicleId);
    }

    [Fact]
    public async Task ValidateWithAgent_PreservesDeterministicDecisionWhenAgentIsUnavailable()
    {
        var controller = new DispatchAgentValidationController(
            new StubDispatchBatchService(),
            new StubAgentValidationClient(new AgentValidationUnavailableException("offline")));

        var action = await controller.ValidateWithAgent(BatchId, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var payload = Assert.IsType<DispatchAgentValidationResponse>(result.Value);
        Assert.Equal("PASS", payload.DeterministicResult);
        Assert.False(payload.AgentAvailable);
        Assert.Null(payload.Explanation);
        Assert.Contains("deterministic backend result", payload.AgentMessage!);
    }

    [Fact]
    public async Task ValidateWithAgent_WithholdsAgentExplanationWhenResultsDisagree()
    {
        var controller = new DispatchAgentValidationController(
            new StubDispatchBatchService(),
            new StubAgentValidationClient(new AgentDispatchValidationResult(
                "s3-dispatch-validation", "FAIL", Array.Empty<AgentValidationRuleResult>(),
                "This must not be shown.", "ollama", Array.Empty<string>())));

        var action = await controller.ValidateWithAgent(BatchId, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var payload = Assert.IsType<DispatchAgentValidationResponse>(result.Value);
        Assert.True(payload.AgentAvailable);
        Assert.False(payload.AgentConsistent);
        Assert.Null(payload.Explanation);
        Assert.Empty(payload.RuleResults);
    }

    [Fact]
    public async Task ValidateCandidate_ReturnsTheAgentSafetyDecisionBeforeBatchCreation()
    {
        var agent = new StubAgentValidationClient(new AgentDispatchValidationResult(
            "s3-candidate-validation",
            "FAIL",
            new[] { new AgentValidationRuleResult("within_weight_capacity", false, "Package weight exceeds vehicle capacity.") },
            "The selected vehicle capacity is exceeded.",
            "deterministic_fallback",
            new[] { "Package weight exceeds vehicle capacity." }));
        var controller = new DispatchAgentValidationController(new StubDispatchBatchService(), agent);
        var packageId = Guid.NewGuid();

        var action = await controller.ValidateCandidate(new ValidateDispatchCandidateRequest(
            WarehouseId,
            new[] { packageId },
            new[] { OrderId },
            "VEH-001",
            500,
            12,
            null), CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var payload = Assert.IsType<DispatchCandidateAgentValidationResponse>(result.Value);
        Assert.Equal("FAIL", payload.Result);
        Assert.Equal("Package weight exceeds vehicle capacity.", payload.RejectionReasons.Single());
        Assert.NotNull(agent.CandidateRequest);
        Assert.Equal(WarehouseId, agent.CandidateRequest!.WarehouseId);
        Assert.Equal(new[] { packageId }, agent.CandidateRequest.PackageIds);
        Assert.Equal(new[] { OrderId }, agent.CandidateRequest.OrderIds);
        Assert.Equal(500, agent.CandidateRequest.MaxWeightKg);
    }

    private sealed class StubAgentValidationClient : IAgentValidationClient
    {
        private readonly AgentDispatchValidationResult? _result;
        private readonly Exception? _exception;

        public StubAgentValidationClient(AgentDispatchValidationResult result) => _result = result;
        public StubAgentValidationClient(Exception exception) => _exception = exception;
        public AgentDispatchValidationRequest? Request { get; private set; }
        public AgentDispatchCandidateValidationRequest? CandidateRequest { get; private set; }

        public Task<AgentDispatchValidationResult> ValidateDispatchAsync(
            AgentDispatchValidationRequest request,
            CancellationToken cancellationToken = default)
        {
            Request = request;
            if (_exception is not null) throw _exception;
            return Task.FromResult(_result!);
        }

        public Task<AgentDispatchValidationResult> ValidateCandidateAsync(
            AgentDispatchCandidateValidationRequest request,
            CancellationToken cancellationToken = default)
        {
            CandidateRequest = request;
            if (_exception is not null) throw _exception;
            return Task.FromResult(_result!);
        }
    }

    private sealed class StubDispatchBatchService : IDispatchBatchService
    {
        public Task<DispatchBatchCreationResponse> CreateBatchAsync(CreateDispatchBatchCommand command, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<DispatchBatchCreationResponse> ReplaceItemsAsync(Guid batchId, ReplaceDispatchBatchItemsCommand command, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<WarehouseThroughputResponse> GetThroughputAsync(Guid warehouseId, WarehouseThroughputQuery query, CancellationToken cancellationToken = default) => throw new NotSupportedException();

        public Task<DispatchBatchValidationResponse> GetValidationAsync(Guid batchId, CancellationToken cancellationToken = default) =>
            Task.FromResult(new DispatchBatchValidationResponse(
                batchId, WarehouseId, 1, 500, 5, true, true, true, true, true, "PASS", Array.Empty<string>()));

        public Task<DispatchBatchValidationContextResponse> GetValidationContextAsync(Guid batchId, CancellationToken cancellationToken = default) =>
            Task.FromResult(new DispatchBatchValidationContextResponse(
                batchId, WarehouseId, "VEH-001", "Reserved", 1000, 12, 500, 5,
                new[] { new DispatchBatchValidationPackageContextResponse(
                    Guid.NewGuid(), OrderId, WarehouseId, "TRACK-001", "Reserved", 500, 5, false, 1) }));

        public Task<DispatchCandidateValidationContextResponse> GetCandidateValidationContextAsync(
            DispatchCandidateValidationContextCommand command,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
