// [S4]  one assigned-run card in the driver portal.
import React from 'react';
import type { ShipmentSummary } from '../types';
import { shipmentBadgeClass } from '../statusBadge';

const formatDispatched = (iso: string | null): string => {
  if (!iso) return 'Not dispatched yet';
  const when = new Date(iso);
  return Number.isNaN(when.getTime())
    ? 'Not dispatched yet'
    : `Dispatched ${when.toLocaleString()}`;
};

interface Props {
  run: ShipmentSummary;
  onOpen?: (run: ShipmentSummary) => void;
}

export const DriverRunCard: React.FC<Props> = ({ run, onOpen }) => {
  const total = run.stopCount || 0;
  const done = run.deliveredCount || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const badgeClass = shipmentBadgeClass(run.status);

  return (
    <article className="run-card">
      <header className="run-card__head">
        <span className="run-card__code">{run.shipmentCode}</span>
        <span className={`run-badge ${badgeClass}`}>{run.status}</span>
      </header>

      <div className="run-card__progress" aria-label={`${done} of ${total} stops delivered`}>
        <div className="run-card__bar">
          <div className="run-card__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="run-card__progress-label">
          {done}/{total} stops
        </span>
      </div>

      <dl className="run-card__meta">
        <div>
          <dt>Distance</dt>
          <dd>{run.totalDistanceKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>{formatDispatched(run.dispatchedAt)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="run-card__open"
        onClick={() => onOpen?.(run)}
        disabled={!onOpen}
      >
        {onOpen ? 'Open run' : 'Run view coming next'}
      </button>
    </article>
  );
};

export default DriverRunCard;
