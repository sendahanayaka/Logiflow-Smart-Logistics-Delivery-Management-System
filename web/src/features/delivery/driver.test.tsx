import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { shipmentBadgeClass, stopBadgeClass } from './statusBadge';
import { activeStopSequence, deliveredCount, isOpenStop } from './driverRun';
import { DriverRunCard } from './components/DriverRunCard';
import type { ShipmentSummary, TimelineEntry } from './types';

const stop = (sequence: number, status: string): TimelineEntry => ({
  sequence,
  stopKey: `s${sequence}`,
  address: `Stop ${sequence}`,
  plannedEta: '2026-09-28T09:00:00Z',
  status,
  actualAt: null,
  note: null,
  onTime: null,
  latitude: 0,
  longitude: 0,
});

describe('statusBadge', () => {
  it('maps known shipment statuses and falls back to planned', () => {
    expect(shipmentBadgeClass('InTransit')).toBe('run-badge--transit');
    expect(shipmentBadgeClass('Delivered')).toBe('run-badge--delivered');
    expect(shipmentBadgeClass('Nonsense')).toBe('run-badge--planned');
  });

  it('maps known stop statuses and falls back to pending', () => {
    expect(stopBadgeClass('Arrived')).toBe('stop-badge--arrived');
    expect(stopBadgeClass('Nonsense')).toBe('stop-badge--pending');
  });
});

describe('driverRun helpers', () => {
  it('treats delivered/skipped stops as finished', () => {
    expect(isOpenStop(stop(1, 'Pending'))).toBe(true);
    expect(isOpenStop(stop(1, 'Delivered'))).toBe(false);
    expect(isOpenStop(stop(1, 'Skipped'))).toBe(false);
  });

  it('finds the first unfinished stop by sequence', () => {
    const stops = [stop(2, 'Pending'), stop(1, 'Delivered'), stop(3, 'Pending')];
    expect(activeStopSequence(stops)).toBe(2);
  });

  it('returns null and full delivered count when the run is complete', () => {
    const stops = [stop(1, 'Delivered'), stop(2, 'Delivered')];
    expect(activeStopSequence(stops)).toBeNull();
    expect(deliveredCount(stops)).toBe(2);
  });
});

describe('DriverRunCard', () => {
  const run: ShipmentSummary = {
    id: 'ship-1',
    shipmentCode: 'SHP-0001',
    status: 'InTransit',
    driverId: 'd1',
    vehicleId: 'v1',
    totalDistanceKm: 12.4,
    stopCount: 4,
    deliveredCount: 1,
    dispatchedAt: null,
    createdAt: '2026-09-28T08:00:00Z',
  };

  it('shows code, status and stop progress', () => {
    render(<DriverRunCard run={run} onOpen={() => {}} />);
    expect(screen.getByText('SHP-0001')).toBeTruthy();
    expect(screen.getByText('InTransit')).toBeTruthy();
    expect(screen.getByText('1/4 stops')).toBeTruthy();
  });

  it('calls onOpen with the run when the button is clicked', () => {
    const onOpen = vi.fn();
    render(<DriverRunCard run={run} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /open run/i }));
    expect(onOpen).toHaveBeenCalledWith(run);
  });
});
