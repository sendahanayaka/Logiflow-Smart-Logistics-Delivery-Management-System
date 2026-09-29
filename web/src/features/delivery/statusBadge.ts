// [S4]  shared status → badge-class maps for the driver portal.

export const shipmentBadgeClass = (status: string): string =>
  ({
    Created: 'run-badge--planned',
    Dispatched: 'run-badge--dispatched',
    InTransit: 'run-badge--transit',
    Delivered: 'run-badge--delivered',
    Failed: 'run-badge--cancelled',
    Cancelled: 'run-badge--cancelled',
  }[status] ?? 'run-badge--planned');

export const stopBadgeClass = (status: string): string =>
  ({
    Pending: 'stop-badge--pending',
    EnRoute: 'stop-badge--enroute',
    Arrived: 'stop-badge--arrived',
    Delivered: 'stop-badge--delivered',
    Skipped: 'stop-badge--skipped',
  }[status] ?? 'stop-badge--pending');
