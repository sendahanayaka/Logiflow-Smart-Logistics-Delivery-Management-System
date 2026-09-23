using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Warehouse;

public sealed class BatchingEngine
{
    public BatchingPlan Plan(
        Guid warehouseId,
        VehicleCapacityContext vehicleCapacity,
        IReadOnlyCollection<BatchingCandidate> candidates)
    {
        var issues = new List<string>();

        if (warehouseId == Guid.Empty)
        {
            issues.Add("A warehouse is required for batching.");
        }

        if (string.IsNullOrWhiteSpace(vehicleCapacity.VehicleId))
        {
            issues.Add("A vehicle ID is required for batching.");
        }

        if (vehicleCapacity.MaxWeightKg <= 0)
        {
            issues.Add("Vehicle maximum weight must be greater than zero.");
        }

        if (vehicleCapacity.MaxVolumeM3 <= 0)
        {
            issues.Add("Vehicle maximum volume must be greater than zero.");
        }

        if (candidates.Count == 0)
        {
            issues.Add("At least one package is required for batching.");
        }

        if (issues.Count > 0)
        {
            return BatchingPlan.Revise(issues);
        }

        if (candidates.Any(candidate => candidate.WarehouseId != warehouseId))
        {
            issues.Add("All requested packages must belong to the batch warehouse.");
        }

        if (candidates.Any(candidate => candidate.Status != PackageStatus.Available))
        {
            issues.Add("Only available packages may be selected for a dispatch batch.");
        }

        var totalWeightKg = candidates.Sum(candidate => candidate.WeightKg);
        var totalVolumeM3 = candidates.Sum(candidate => candidate.VolumeM3);

        if (totalWeightKg > vehicleCapacity.MaxWeightKg)
        {
            issues.Add("The requested packages exceed vehicle weight capacity.");
        }

        if (totalVolumeM3 > vehicleCapacity.MaxVolumeM3)
        {
            issues.Add("The requested packages exceed vehicle volume capacity.");
        }

        if (issues.Count > 0)
        {
            return BatchingPlan.Revise(issues, totalWeightKg, totalVolumeM3);
        }

        var sizedCandidates = candidates
            .Select(candidate => new SizedCandidate(
                candidate,
                CalculateNormalizedSize(candidate, vehicleCapacity)))
            .ToList();

        // The first-fit-decreasing pass uses a deterministic zone grouping, then
        // normalized-size descending order within each zone. It is deliberately
        // separate from load order because load order must keep fragile packages on top.
        var placementOrder = sizedCandidates
            .OrderBy(candidate => candidate.Candidate.StorageZoneCode, StringComparer.Ordinal)
            .ThenByDescending(candidate => candidate.NormalizedSize)
            .ThenByDescending(candidate => candidate.Candidate.WeightKg)
            .ThenByDescending(candidate => candidate.Candidate.VolumeM3)
            .ThenBy(candidate => candidate.Candidate.TrackingCode, StringComparer.Ordinal)
            .ThenBy(candidate => candidate.Candidate.PackageId)
            .ToList();

        var remainingWeightKg = vehicleCapacity.MaxWeightKg;
        var remainingVolumeM3 = vehicleCapacity.MaxVolumeM3;
        var placementSequence = 0;

        foreach (var candidate in placementOrder)
        {
            if (candidate.Candidate.WeightKg > remainingWeightKg ||
                candidate.Candidate.VolumeM3 > remainingVolumeM3)
            {
                return BatchingPlan.Revise(
                    new[]
                    {
                        $"Package '{candidate.Candidate.TrackingCode}' cannot be safely placed in the requested batch."
                    },
                    totalWeightKg,
                    totalVolumeM3);
            }

            candidate.PlacementSequence = ++placementSequence;
            remainingWeightKg -= candidate.Candidate.WeightKg;
            remainingVolumeM3 -= candidate.Candidate.VolumeM3;
        }

        // Packages loaded later are physically above earlier packages. All fragile
        // packages therefore form the final/top-safe segment, never below a
        // non-fragile package. Within each safety segment, heavier items load first.
        var loadOrder = sizedCandidates
            .OrderBy(candidate => candidate.Candidate.IsFragile)
            .ThenByDescending(candidate => candidate.Candidate.WeightKg)
            .ThenByDescending(candidate => candidate.NormalizedSize)
            .ThenBy(candidate => candidate.Candidate.StorageZoneCode, StringComparer.Ordinal)
            .ThenBy(candidate => candidate.Candidate.TrackingCode, StringComparer.Ordinal)
            .ThenBy(candidate => candidate.Candidate.PackageId)
            .ToList();

        var items = loadOrder
            .Select((candidate, index) => new BatchingPlanItem(
                candidate.Candidate.PackageId,
                candidate.Candidate.TrackingCode,
                candidate.Candidate.StorageZoneCode,
                candidate.Candidate.WeightKg,
                candidate.Candidate.VolumeM3,
                candidate.Candidate.IsFragile,
                candidate.NormalizedSize,
                candidate.PlacementSequence,
                index + 1))
            .ToList();

        return BatchingPlan.Pass(items, totalWeightKg, totalVolumeM3);
    }

    private static decimal CalculateNormalizedSize(
        BatchingCandidate candidate,
        VehicleCapacityContext vehicleCapacity) =>
        Math.Max(
            candidate.WeightKg / vehicleCapacity.MaxWeightKg,
            candidate.VolumeM3 / vehicleCapacity.MaxVolumeM3);

    private sealed class SizedCandidate
    {
        public SizedCandidate(BatchingCandidate candidate, decimal normalizedSize)
        {
            Candidate = candidate;
            NormalizedSize = normalizedSize;
        }

        public BatchingCandidate Candidate { get; }
        public decimal NormalizedSize { get; }
        public int PlacementSequence { get; set; }
    }
}
