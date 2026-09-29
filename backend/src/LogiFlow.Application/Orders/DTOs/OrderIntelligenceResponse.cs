using System;
using System.Collections.Generic;

namespace LogiFlow.Application.Orders.DTOs;

public record OrderIntelligenceResponse(
    decimal VolumeM3,
    string WeightClassification,
    string HandlingRequirement,
    string RecommendedPriority,
    IReadOnlyList<string> RisksOrAmbiguities
);
