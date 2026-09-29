// [S4]  pure helpers for driver run progress.
import type { TimelineEntry } from './types';

/** A stop the driver still has to work: not yet delivered or skipped. */
export const isOpenStop = (stop: TimelineEntry): boolean =>
  stop.status !== 'Delivered' && stop.status !== 'Skipped';

/**
 * The sequence number of the stop the driver is currently working — the first
 * (by sequence) that isn't finished — or null when the whole run is complete.
 */
export const activeStopSequence = (stops: TimelineEntry[]): number | null => {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  return sorted.find(isOpenStop)?.sequence ?? null;
};

/** Count of stops delivered on a run. */
export const deliveredCount = (stops: TimelineEntry[]): number =>
  stops.filter((stop) => stop.status === 'Delivered').length;
