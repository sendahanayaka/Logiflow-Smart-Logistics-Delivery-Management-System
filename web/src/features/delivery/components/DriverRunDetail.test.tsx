import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Trackable mock for the end-assignment mutation (hoisted so vi.mock can use it).
const { endMock } = vi.hoisted(() => ({
  endMock: vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
}));

// A run whose stops are ALL delivered => the run is complete.
const completeRun: any = {
  shipmentCode: 'SHP-DONE-01',
  status: 'InTransit',
  stops: [
    { sequence: 1, stopKey: 's1', address: 'Stop 1', status: 'Delivered', plannedEta: '2026-09-28T09:00:00Z', actualAt: '2026-09-28T09:05:00Z', onTime: true, latitude: 6.9, longitude: 79.8, distanceFromPrevKm: 2, recipientName: 'Kasun', recipientContact: '0771234567' },
    { sequence: 2, stopKey: 's2', address: 'Stop 2', status: 'Delivered', plannedEta: '2026-09-28T09:20:00Z', actualAt: '2026-09-28T09:25:00Z', onTime: true, latitude: 6.91, longitude: 79.81, distanceFromPrevKm: 3, recipientName: 'Amara', recipientContact: '0719876543' },
  ],
};

// A run still in progress => one stop open, so the run is NOT complete.
const inProgressRun: any = {
  ...completeRun,
  stops: [
    { ...completeRun.stops[0] },
    { ...completeRun.stops[1], status: 'Pending', actualAt: null, onTime: null },
  ],
};

let currentRun: any = completeRun;

// Avoid pulling Leaflet/react-leaflet into jsdom.
vi.mock('./RouteMap', () => ({ RouteMap: () => <div data-testid="route-map" /> }));

// Stub the RTK Query hooks the component uses.
vi.mock('../deliveryApi', () => ({
  useGetDriverRunQuery: () => ({ data: currentRun, isLoading: false, isError: false, refetch: vi.fn() }),
  useRecordStopEventMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }],
  useStartRunMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }],
  useEndMyAssignmentMutation: () => [endMock, { isLoading: false }],
}));

import { DriverRunDetail } from './DriverRunDetail';

const renderDetail = () =>
  render(
    <MemoryRouter>
      <DriverRunDetail shipmentId="ship-1" />
    </MemoryRouter>,
  );

describe('DriverRunDetail — end assignment (S4)', () => {
  beforeEach(() => {
    endMock.mockClear();
    currentRun = completeRun;
  });

  // WEB-DRD-01 (UI-state): when every stop is delivered, the driver sees the
  // "End assignment" action.
  it('shows the End assignment button when the run is complete', () => {
    renderDetail();
    expect(screen.getByText(/run complete/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /end assignment/i })).toBeTruthy();
  });

  // WEB-DRD-02 (interaction): clicking it calls the end-assignment mutation and the
  // confirmation message replaces the button.
  it('ends the assignment and shows confirmation on click', async () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /end assignment/i }));
    expect(endMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/you and your vehicle are now available/i)).toBeTruthy();
  });

  // WEB-DRD-03 (UI-state, negative): while a stop is still open, the End assignment
  // action must NOT be offered.
  it('does not show End assignment while a stop is still open', () => {
    currentRun = inProgressRun;
    renderDetail();
    expect(screen.queryByRole('button', { name: /end assignment/i })).toBeNull();
  });
});
