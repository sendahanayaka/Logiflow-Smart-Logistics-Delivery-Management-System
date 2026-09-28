// [S4]  shipment service
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Delivery.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LogiFlow.Application.Delivery;

public class ShipmentService : IShipmentService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<ShipmentService> _logger;

    public ShipmentService(IAppDbContext context, ICurrentUserService currentUser, ILogger<ShipmentService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _logger = logger;
    }

    public Task<IReadOnlyList<ShipmentSummary>> ListShipmentsAsync(CancellationToken cancellationToken = default) =>
        ProjectSummariesAsync(_context.Shipments.AsNoTracking(), cancellationToken);

    public async Task<IReadOnlyList<ShipmentSummary>> GetMyRunsAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return Array.Empty<ShipmentSummary>();
        }

        // Resolve the signed-in driver's fleet profile (Driver.UserId links to the account),
        // then list only the shipments assigned to that driver.
        var driverId = await _context.Drivers
            .AsNoTracking()
            .Where(driver => driver.UserId == userId)
            .Select(driver => (Guid?)driver.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (driverId is null)
        {
            return Array.Empty<ShipmentSummary>();
        }

        return await ProjectSummariesAsync(
            _context.Shipments.AsNoTracking().Where(shipment => shipment.DriverId == driverId),
            cancellationToken);
    }

    private static async Task<IReadOnlyList<ShipmentSummary>> ProjectSummariesAsync(
        IQueryable<Shipment> query, CancellationToken cancellationToken)
    {
        var rows = await query
            .OrderByDescending(shipment => shipment.CreatedAt)
            .Select(shipment => new
            {
                shipment.Id,
                shipment.ShipmentCode,
                shipment.Status,
                shipment.DriverId,
                shipment.VehicleId,
                shipment.TotalDistanceKm,
                StopCount = shipment.AgentWorkflow.RouteStops.Count,
                DeliveredCount = shipment.AgentWorkflow.RouteStops.Count(stop => stop.Status == RouteStopStatus.Delivered),
                shipment.DispatchedAt,
                shipment.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new ShipmentSummary(
                row.Id, row.ShipmentCode, row.Status.ToString(), row.DriverId, row.VehicleId,
                row.TotalDistanceKm, row.StopCount, row.DeliveredCount, row.DispatchedAt, row.CreatedAt))
            .ToList();
    }

    public async Task<TrackingView?> GetTrackingAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        var shipment = await LoadAsync(shipmentId, track: false, cancellationToken);
        return shipment is null ? null : ToTrackingView(shipment);
    }

    public async Task<DriverRunView?> GetDriverRunAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        var shipment = await LoadAsync(shipmentId, track: false, cancellationToken);
        if (shipment is null)
        {
            return null;
        }

        return new DriverRunView(
            shipment.Id, shipment.ShipmentCode, shipment.Status.ToString(),
            shipment.DriverId, shipment.VehicleId, BuildTimeline(shipment));
    }

    public async Task<TrackingView> RecordStopEventAsync(
        Guid shipmentId, RecordStopEventCommand command, CancellationToken cancellationToken = default)
    {
        var shipment = await LoadAsync(shipmentId, track: true, cancellationToken)
            ?? throw new KeyNotFoundException($"Shipment '{shipmentId}' was not found.");

        var stops = shipment.AgentWorkflow.RouteStops.OrderBy(stop => stop.Sequence).ToList();
        var stop = stops.FirstOrDefault(s => string.Equals(s.StopKey, command.StopKey, StringComparison.OrdinalIgnoreCase))
            ?? throw new KeyNotFoundException($"Stop '{command.StopKey}' was not found on this shipment.");

        var occurredAt = AsUtc(command.OccurredAt ?? DateTime.UtcNow);
        var kind = command.Kind?.Trim().ToUpperInvariant();
        var (eventType, newStatus) = kind switch
        {
            "ARRIVED" => (TrackingEventType.ArrivedStop, RouteStopStatus.Arrived),
            "DEPARTED" => (TrackingEventType.DepartedStop, RouteStopStatus.EnRoute),
            _ => throw new ArgumentException("Kind must be ARRIVED or DEPARTED.", nameof(command))
        };

        stop.Status = newStatus;
        stop.UpdatedAt = DateTime.UtcNow;
        AddEvent(shipment.Id, stop.Id, eventType, occurredAt, command.Note, command.Latitude, command.Longitude);

        // The recompute: an actual arrival that differs from the plan shifts every
        // downstream (not-yet-delivered) ETA by the same delay.
        if (eventType == TrackingEventType.ArrivedStop)
        {
            stop.OnTime = EtaEngine.WithinWindow(occurredAt, stop.WindowStart, stop.WindowEnd);
            var delay = occurredAt - AsUtc(stop.Eta);
            if (Math.Abs(delay.TotalMinutes) >= 1)
            {
                foreach (var downstream in stops.Where(s =>
                    s.Sequence > stop.Sequence && s.Status != RouteStopStatus.Delivered))
                {
                    downstream.Eta = AsUtc(downstream.Eta).Add(delay);
                    downstream.OnTime = EtaEngine.WithinWindow(downstream.Eta, downstream.WindowStart, downstream.WindowEnd);
                    downstream.UpdatedAt = DateTime.UtcNow;
                }

                // Run-level event (no stop id) so it doesn't mask the stop's arrival time.
                AddEvent(shipment.Id, null, TrackingEventType.EtaRecalculated, DateTime.UtcNow,
                    $"Downstream ETAs shifted by {delay.TotalMinutes:0} min after arrival at {stop.StopKey}.",
                    null, null);
                _logger.LogInformation(
                    "Shipment {Code}: recomputed downstream ETAs (+{Minutes} min).",
                    shipment.ShipmentCode, delay.TotalMinutes);
            }
        }

        if (shipment.Status == ShipmentStatus.Dispatched)
        {
            shipment.Status = ShipmentStatus.InTransit;
        }
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return ToTrackingView(shipment);
    }

    public async Task<TrackingView> RecordProofOfDeliveryAsync(
        Guid shipmentId, RecordPodCommand command, CancellationToken cancellationToken = default)
    {
        var shipment = await LoadAsync(shipmentId, track: true, cancellationToken)
            ?? throw new KeyNotFoundException($"Shipment '{shipmentId}' was not found.");

        var stops = shipment.AgentWorkflow.RouteStops.OrderBy(stop => stop.Sequence).ToList();
        var stop = stops.FirstOrDefault(s => string.Equals(s.StopKey, command.StopKey, StringComparison.OrdinalIgnoreCase))
            ?? throw new KeyNotFoundException($"Stop '{command.StopKey}' was not found on this shipment.");

        if (shipment.ProofOfDeliveries.Any(pod => pod.RouteStopId == stop.Id))
        {
            throw new InvalidOperationException($"Stop '{command.StopKey}' already has a proof of delivery.");
        }

        var deliveredAt = AsUtc(command.DeliveredAt ?? DateTime.UtcNow);

        _context.ProofOfDeliveries.Add(new ProofOfDelivery
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            RouteStopId = stop.Id,
            ReceivedByName = command.ReceivedByName,
            SignatureImageUrl = command.SignatureImageUrl,
            PhotoUrl = command.PhotoUrl,
            Notes = command.Notes,
            DeliveredAt = deliveredAt,
            CreatedAt = DateTime.UtcNow
        });

        stop.Status = RouteStopStatus.Delivered;
        stop.OnTime = EtaEngine.WithinWindow(deliveredAt, stop.WindowStart, stop.WindowEnd);
        stop.UpdatedAt = DateTime.UtcNow;
        AddEvent(shipment.Id, stop.Id, TrackingEventType.Delivered, deliveredAt,
            command.ReceivedByName is null ? "Delivered." : $"Delivered to {command.ReceivedByName}.", null, null);

        if (stops.All(s => s.Status == RouteStopStatus.Delivered))
        {
            shipment.Status = ShipmentStatus.Delivered;
            shipment.CompletedAt = DateTime.UtcNow;
        }
        else if (shipment.Status == ShipmentStatus.Dispatched)
        {
            shipment.Status = ShipmentStatus.InTransit;
        }
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return ToTrackingView(shipment);
    }

    // --- helpers --------------------------------------------------------------

    private async Task<Shipment?> LoadAsync(Guid shipmentId, bool track, CancellationToken cancellationToken)
    {
        IQueryable<Shipment> query = _context.Shipments
            .Include(s => s.TrackingEvents)
            .Include(s => s.ProofOfDeliveries)
            .Include(s => s.AgentWorkflow).ThenInclude(w => w.RouteStops);

        if (!track)
        {
            query = query.AsNoTracking();
        }

        return await query.FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken);
    }

    // Add via the DbSet (forces Added — the shipment is a tracked parent, so a
    // nav-collection add would be mis-flagged Modified; see backend conventions).
    private void AddEvent(
        Guid shipmentId, Guid? routeStopId, TrackingEventType type,
        DateTime occurredAt, string? note, double? lat, double? lng)
    {
        _context.TrackingEvents.Add(new TrackingEvent
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            RouteStopId = routeStopId,
            EventType = type,
            OccurredAt = occurredAt,
            Note = note,
            Latitude = lat,
            Longitude = lng,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static TrackingView ToTrackingView(Shipment shipment) =>
        new(shipment.Id, shipment.ShipmentCode, shipment.Status.ToString(), BuildTimeline(shipment));

    private static IReadOnlyList<TimelineEntry> BuildTimeline(Shipment shipment)
    {
        var routeStops = shipment.AgentWorkflow.RouteStops.OrderBy(stop => stop.Sequence).ToList();
        var sequenceById = routeStops.ToDictionary(stop => stop.Id, stop => stop.Sequence);

        var plannedStops = routeStops
            .Select(stop => new TimelineStop(
                stop.Sequence, stop.StopKey, stop.Address, stop.Eta, stop.Status.ToString(),
                stop.OnTime, stop.Latitude, stop.Longitude))
            .ToList();

        var events = shipment.TrackingEvents
            .Select(evt => new TimelineEvent(
                evt.RouteStopId is not null && sequenceById.TryGetValue(evt.RouteStopId.Value, out var seq)
                    ? seq : (int?)null,
                evt.EventType.ToString(), evt.OccurredAt, evt.Note))
            .ToList();

        return TimelineBuilder.Build(plannedStops, events);
    }

    private static DateTime AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
