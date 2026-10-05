// [S4]  driver run detail — ordered stops + arrive/depart progress.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDriverRunQuery, useRecordStopEventMutation, useStartRunMutation } from '../deliveryApi';
import { shipmentBadgeClass, stopBadgeClass } from '../statusBadge';
import { activeStopSequence, deliveredCount } from '../driverRun';
import { PodForm } from './PodForm';
import { TrackingMap } from './TrackingMap';
import '../delivery.css'; // map-sketch styles

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

export const DriverRunDetail: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const { data: run, isLoading, isError, refetch } = useGetDriverRunQuery(shipmentId);
  const [recordEvent, { isLoading: saving }] = useRecordStopEventMutation();
  const [startRun, { isLoading: starting }] = useStartRunMutation();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <div className="driver-state">Loading run…</div>;
  }

  if (isError || !run) {
    return (
      <div className="driver-state driver-state--error">
        Couldn’t load this run.
        <div style={{ marginTop: '1rem' }}>
          <Link to="/driver" className="run-card__open" style={{ marginRight: '0.5rem' }}>Back</Link>
          <button type="button" className="run-card__open" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const stops = [...run.stops].sort((a, b) => a.sequence - b.sequence);
  const activeSeq = activeStopSequence(stops);
  const delivered = deliveredCount(stops);

  const record = async (stopKey: string, kind: 'ARRIVED' | 'DEPARTED') => {
    setError(null);
    try {
      await recordEvent({ id: shipmentId, body: { stopKey, kind } }).unwrap();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not record the update. Please try again.';
      setError(message);
    }
  };

  const openRun = async () => {
    setError(null);
    try {
      await startRun(shipmentId).unwrap();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not start the run. Please try again.';
      setError(message);
    }
  };

  const notStarted = run.status === 'Created';

  return (
    <>
      <div className="run-detail__top">
        <Link to="/driver" className="run-detail__back">← My runs</Link>
      </div>

      <header className="run-detail__head">
        <div className="run-detail__title">
          <span className="run-card__code">{run.shipmentCode}</span>
          <span className={`run-badge ${shipmentBadgeClass(run.status)}`}>{run.status}</span>
        </div>
        <span className="run-detail__progress">{delivered}/{stops.length} delivered</span>
      </header>

      <div className="run-detail__map">
        <TrackingMap stops={stops} />
      </div>

      {error && <div className="run-detail__error">{error}</div>}

      {notStarted && (
        <div className="run-detail__start">
          <p>This run is assigned to you and ready for pickup.</p>
          <button type="button" className="stop__btn stop__btn--primary" disabled={starting} onClick={openRun}>
            {starting ? 'Opening…' : 'Open run — confirm pickup'}
          </button>
        </div>
      )}

      {activeSeq === null && (
        <div className="run-detail__done">✓ Run complete — all stops delivered.</div>
      )}

      <ol className="stop-list">
        {stops.map((s) => {
          const active = s.sequence === activeSeq;
          return (
            <li key={s.sequence} className={`stop${active ? ' stop--active' : ''}`}>
              <div className="stop__seq">{s.sequence}</div>
              <div className="stop__body">
                <div className="stop__head">
                  <strong>{s.address}</strong>
                  <span className={`stop-badge ${stopBadgeClass(s.status)}`}>{s.status}</span>
                </div>
                {(s.recipientName || s.recipientContact) && (
                  <div className="stop__recipient">
                    Deliver to <strong>{s.recipientName || 'Recipient'}</strong>
                    {s.recipientContact && (
                      <> · <a href={`tel:${s.recipientContact}`}>📞 {s.recipientContact}</a></>
                    )}
                  </div>
                )}
                <div className="stop__meta">
                  <span>ETA {fmt(s.plannedEta)}</span>
                  {typeof s.distanceFromPrevKm === 'number' && s.distanceFromPrevKm > 0 && (
                    <span> · {s.distanceFromPrevKm.toFixed(1)} km</span>
                  )}
                  {s.actualAt && <span> · arrived {fmt(s.actualAt)}</span>}
                  {s.onTime !== null && (
                    <span className={s.onTime ? 'stop__ontime' : 'stop__late'}>
                      {' '}· {s.onTime ? 'on time' : 'off window'}
                    </span>
                  )}
                </div>

                {active && !notStarted && (
                  <div className="stop__actions">
                    {s.status === 'Pending' && (
                      <button
                        type="button"
                        className="stop__btn stop__btn--secondary"
                        disabled={saving}
                        onClick={() => record(s.stopKey, 'DEPARTED')}
                      >
                        Mark en route
                      </button>
                    )}
                    {(s.status === 'Pending' || s.status === 'EnRoute') && (
                      <button
                        type="button"
                        className="stop__btn stop__btn--primary"
                        disabled={saving}
                        onClick={() => record(s.stopKey, 'ARRIVED')}
                      >
                        Mark arrived
                      </button>
                    )}
                    {s.status === 'Arrived' && (
                      <PodForm shipmentId={shipmentId} stopKey={s.stopKey} />
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
};

export default DriverRunDetail;
