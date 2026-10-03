using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using LogiFlow.Application.Delivery.DTOs;
using LogiFlow.Application.Workflows.DTOs;
using Xunit;

namespace LogiFlow.IntegrationTests.Delivery;

public class WorkflowFlowTests : IClassFixture<IntegrationTestFactory>
{
    private readonly IntegrationTestFactory _factory;

    public WorkflowFlowTests(IntegrationTestFactory factory) => _factory = factory;

    private HttpClient Authed(string role)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.For(role));
        return client;
    }

    private static object TriggerBody() => new
    {
        dispatchBatchId = Guid.NewGuid(),
        objective = "Deliver 2 Kandy stops",
        deliveryWindowStart = new DateTime(2026, 9, 22, 9, 0, 0),
        customerNotes = "handle fragile",
        stops = new[]
        {
            new { stopKey = "s1", orderId = Guid.NewGuid(), address = "Kandy 1",
                  latitude = 7.2906, longitude = 80.6337,
                  windowStart = new DateTime(2026, 9, 22, 9, 0, 0), windowEnd = new DateTime(2026, 9, 22, 17, 0, 0) },
            new { stopKey = "s2", orderId = Guid.NewGuid(), address = "Kandy 2",
                  latitude = 7.2950, longitude = 80.6350,
                  windowStart = new DateTime(2026, 9, 22, 9, 0, 0), windowEnd = new DateTime(2026, 9, 22, 17, 0, 0) },
        }
    };

    // --- auth enforcement -----------------------------------------------------

    [Fact]
    public async Task Trigger_WithoutToken_Is401()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/workflows", TriggerBody());
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Trigger_WithDriverRole_Is403()
    {
        // /api/workflows requires ADMIN; a DRIVER token is authenticated but not authorized.
        var response = await Authed("DRIVER").PostAsJsonAsync("/api/workflows", TriggerBody());
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // --- full happy path over HTTP --------------------------------------------

    [Fact]
    public async Task FullFlow_Trigger_Approve_Drive_Track()
    {
        var admin = Authed("ADMIN");

        // 1. ops triggers the routing agent
        var triggerResponse = await admin.PostAsJsonAsync("/api/workflows", TriggerBody());
        Assert.Equal(HttpStatusCode.Created, triggerResponse.StatusCode);
        var workflow = await triggerResponse.Content.ReadFromJsonAsync<WorkflowResponse>();
        Assert.Equal("AwaitingApproval", workflow!.Status);
        Assert.Equal(2, workflow.StopCount);

        // 2. ops approves -> dispatched shipment
        var approveResponse = await admin.PostAsJsonAsync($"/api/workflows/{workflow.Id}/approval",
            new { action = "APPROVE", decidedBy = "ops-manager", driverId = Guid.NewGuid(), vehicleId = Guid.NewGuid() });
        approveResponse.EnsureSuccessStatusCode();
        var approval = await approveResponse.Content.ReadFromJsonAsync<ApprovalResult>();
        Assert.Equal("Completed", approval!.Status);
        Assert.NotNull(approval.ShipmentId);
        var shipmentId = approval.ShipmentId!.Value;

        // 3. driver runs it: fetch run, report arrival, capture POD
        var driver = Authed("DRIVER");
        (await driver.GetAsync($"/api/shipments/{shipmentId}/run")).EnsureSuccessStatusCode();
        (await driver.PostAsJsonAsync($"/api/shipments/{shipmentId}/events",
            new { stopKey = "s1", kind = "ARRIVED" })).EnsureSuccessStatusCode();
        (await driver.PostAsJsonAsync($"/api/shipments/{shipmentId}/pod",
            new { stopKey = "s1", receivedByName = "Kasun" })).EnsureSuccessStatusCode();

        // 4. customer tracks it
        var trackResponse = await Authed("CUSTOMER").GetAsync($"/api/tracking/{shipmentId}");
        trackResponse.EnsureSuccessStatusCode();
        var tracking = await trackResponse.Content.ReadFromJsonAsync<TrackingView>();
        Assert.Equal(2, tracking!.Stops.Count);
        Assert.Equal("Delivered", tracking.Stops[0].Status); // s1 delivered
    }
}
