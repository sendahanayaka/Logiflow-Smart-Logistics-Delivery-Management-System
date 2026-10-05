// [S4] Real OSM map (item 11). Uses react-leaflet + CircleMarkers (no marker-icon
// asset wiring needed). Shows a route polyline + colored stops + an optional driver.
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}

interface RouteMapProps {
  markers: MapMarker[];
  path?: [number, number][];
  height?: number;
}

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, points]);
  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({ markers, path, height = 260 }) => {
  const valid = markers.filter((m) => m.lat !== 0 || m.lng !== 0);
  if (valid.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 10, color: '#94a3b8' }}>
        Map location not available yet.
      </div>
    );
  }
  const bounds: [number, number][] = valid.map((m) => [m.lat, m.lng]);

  return (
    <div style={{ height, borderRadius: 10, overflow: 'hidden' }}>
      <MapContainer center={bounds[0]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {path && path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#4338ca', weight: 4, opacity: 0.7 }} />}
        {valid.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 2, fillColor: m.color ?? '#4338ca', fillOpacity: 1 }}
          >
            {m.label && <Popup>{m.label}</Popup>}
          </CircleMarker>
        ))}
        <FitBounds points={bounds} />
      </MapContainer>
    </div>
  );
};
