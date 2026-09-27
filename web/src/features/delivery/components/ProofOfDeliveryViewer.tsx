// [S4]  POD viewer
import React from 'react';
import type { TimelineEntry } from '../types';

export const ProofOfDeliveryViewer: React.FC<{ stops: TimelineEntry[] }> = ({ stops }) => {
    const delivered = stops.filter((s) => s.status === 'Delivered');
    if (delivered.length === 0) return <p className="admin-muted">No deliveries recorded yet.</p>;

    return (
        <ul className="pod-list">
            {delivered.map((s) => (
                <li key={s.sequence}>
                    <strong>#{s.sequence} · {s.address}</strong>
                    <span className="pod-list__time">
                        delivered {s.actualAt ? new Date(s.actualAt).toLocaleString() : ''}
                    </span>
                    {s.note && <em className="pod-list__note">{s.note}</em>}
                </li>
            ))}
        </ul>
    );
};
