import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mutable mock state (hoisted so the vi.mock factory can read it).
const state = vi.hoisted(() => ({
  unread: 0,
  items: [] as any[],
  markAll: vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
}));

vi.mock('./notificationsApi', () => ({
  useGetUnreadCountQuery: () => ({ data: state.unread }),
  useGetNotificationsQuery: () => ({ data: state.items }),
  useMarkNotificationReadMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) }))],
  useMarkAllNotificationsReadMutation: () => [state.markAll],
}));

import { NotificationBell } from './NotificationBell';

const renderBell = () =>
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );

describe('NotificationBell (S4)', () => {
  beforeEach(() => {
    state.unread = 0;
    state.items = [];
    state.markAll.mockClear();
  });

  // WEB-NB-01 (UI-state): unread count renders as a badge.
  it('shows the unread badge with the count', () => {
    state.unread = 3;
    const { container } = renderBell();
    const badge = container.querySelector('.notif-bell__badge');
    expect(badge?.textContent).toBe('3');
  });

  // WEB-NB-02 (boundary): a count above 9 is capped at "9+".
  it('caps the badge at 9+ for large counts', () => {
    state.unread = 25;
    const { container } = renderBell();
    expect(container.querySelector('.notif-bell__badge')?.textContent).toBe('9+');
  });

  // WEB-NB-03 (UI-state, negative): no badge when there is nothing unread.
  it('shows no badge when there are no unread notifications', () => {
    state.unread = 0;
    const { container } = renderBell();
    expect(container.querySelector('.notif-bell__badge')).toBeNull();
  });

  // WEB-NB-04 (interaction): opening the panel lists notifications and "Mark all read"
  // triggers the mutation.
  it('opens the panel, lists items, and marks all read', () => {
    state.unread = 1;
    state.items = [{ id: 'n1', title: 'Order delivered', message: 'Your order arrived', createdAt: new Date().toISOString(), isRead: false, orderId: null }];
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Order delivered')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    expect(state.markAll).toHaveBeenCalledTimes(1);
  });
});
