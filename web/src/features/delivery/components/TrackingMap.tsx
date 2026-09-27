// [S4]  route sketch — a lightweight, dependency-free plot of the stops by
// lat/lng (relative positions + visiting order). Not a geographic map tile.
import React from 'react';
import type { TimelineEntry } from '../types';

const W = 600;
const H = 300;
const PAD = 36;

export const TrackingMap: React.FC<{ stops: TimelineEntry[] }> = ({ stops }) => {
    const pts = stops.filter((s) => s.latitude !== 0 || s.longitude !== 0);
    if (pts.length === 0) {
        return <div className="map-sketch map-sketch--empty">No coordinates to plot.</div>;
    }

    const lats = pts.map((p) => p.latitude);
    const lngs = pts.map((p) => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 1;
    const spanLng = maxLng - minLng || 1;

    const x = (lng: number) => PAD + ((lng - minLng) / spanLng) * (W - 2 * PAD);
    const y = (lat: number) => PAD + ((maxLat - lat) / spanLat) * (H - 2 * PAD); // north = up

    const path = pts
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.longitude).toFixed(1)} ${y(p.latitude).toFixed(1)}`)
        .join(' ');

    return (
        <svg className="map-sketch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="route sketch">
            <path d={path} className="map-sketch__route" />
            {pts.map((p) => (
                <g key={p.sequence} transform={`translate(${x(p.longitude).toFixed(1)},${y(p.latitude).toFixed(1)})`}>
                    <circle r={13} className={`map-sketch__stop map-sketch__stop--${p.status}`} />
                    <text className="map-sketch__label" dy="4" textAnchor="middle">{p.sequence}</text>
                </g>
            ))}
        </svg>
    );
};
