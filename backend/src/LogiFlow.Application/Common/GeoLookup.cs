namespace LogiFlow.Application.Common;

/// <summary>
/// Static coordinate lookup for major Sri Lankan cities. Delivery orders capture a
/// city + address but no coordinates, and the routing agent needs lat/lng — so we
/// resolve the delivery city here (free, offline; no geocoding service). Unknown
/// cities fall back to Colombo so a run is never blocked for a missing coordinate.
/// </summary>
public static class GeoLookup
{
    private static readonly (double Lat, double Lng) Fallback = (6.9271, 79.8612); // Colombo

    private static readonly IReadOnlyDictionary<string, (double Lat, double Lng)> Cities =
        new Dictionary<string, (double, double)>(StringComparer.OrdinalIgnoreCase)
        {
            ["Colombo"] = (6.9271, 79.8612),
            ["Dehiwala"] = (6.8560, 79.8654),
            ["Moratuwa"] = (6.7730, 79.8816),
            ["Sri Jayawardenepura Kotte"] = (6.8880, 79.9180),
            ["Kotte"] = (6.8880, 79.9180),
            ["Negombo"] = (7.2083, 79.8358),
            ["Gampaha"] = (7.0917, 79.9997),
            ["Kalutara"] = (6.5854, 79.9607),
            ["Kandy"] = (7.2906, 80.6337),
            ["Matale"] = (7.4675, 80.6234),
            ["Nuwara Eliya"] = (6.9497, 80.7891),
            ["Galle"] = (6.0535, 80.2210),
            ["Matara"] = (5.9549, 80.5550),
            ["Hambantota"] = (6.1246, 81.1185),
            ["Jaffna"] = (9.6615, 80.0255),
            ["Vavuniya"] = (8.7514, 80.4971),
            ["Trincomalee"] = (8.5874, 81.2152),
            ["Batticaloa"] = (7.7170, 81.7000),
            ["Ampara"] = (7.2917, 81.6725),
            ["Kurunegala"] = (7.4863, 80.3647),
            ["Puttalam"] = (8.0362, 79.8283),
            ["Anuradhapura"] = (8.3114, 80.4037),
            ["Polonnaruwa"] = (7.9403, 81.0188),
            ["Badulla"] = (6.9934, 81.0550),
            ["Ratnapura"] = (6.6828, 80.3992),
            ["Kegalle"] = (7.2513, 80.3464),
        };

    /// <summary>Resolve a city name to coordinates, defaulting to Colombo when unknown.</summary>
    public static (double Lat, double Lng) Resolve(string? city) =>
        !string.IsNullOrWhiteSpace(city) && Cities.TryGetValue(city.Trim(), out var coords)
            ? coords
            : Fallback;
}
