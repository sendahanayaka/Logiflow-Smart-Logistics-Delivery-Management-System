// [S4]  tracking timeline
import React from 'react';
import type { TimelineEntry } from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

export const TrackingTimeline: React.FC<{ stops: TimelineEntry[] }> = ({ stops }) => {
    if (!stops.length) return <p className="admin-muted">No stops on this run.</p>;

    return (
        <ol className="tl">
            {stops.map((s) => (
                <li key={s.sequence} className={`tl__item tl__item--${s.status}`}>
                    <span className="tl__dot" />
                    <div className="tl__body">
                        <div className="tl__head">
                            <strong>#{s.sequence} · {s.address}</strong>
                            <span className={`tl__status tl__status--${s.status}`}>{s.status}</span>
                        </div>
                        <div className="tl__meta">
                            <span>ETA {fmt(s.plannedEta)}</span>
                            {s.actualAt && <span> · actual {fmt(s.actualAt)}</span>}
                            {s.onTime !== null && <span> · {s.onTime ? 'on time' : 'off window'}</span>}
                        </div>
                        {s.note && <div className="tl__note">{s.note}</div>}
                    </div>
                </li>
            ))}
        </ol>
    );
};
