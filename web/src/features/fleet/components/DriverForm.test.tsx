import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
}));

const idleResult = { isLoading: false, isError: false, isSuccess: false, error: undefined };

vi.mock('../api/fleetApi', () => ({
  useCreateDriverMutation: () => [createMock, idleResult],
  useUpdateDriverMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), idleResult],
}));
vi.mock('../../users/usersApi', () => ({
  useGetUsersQuery: () => ({ data: [] }),
}));

import { DriverForm } from './DriverForm';

const renderForm = () =>
  render(
    <MemoryRouter>
      <DriverForm />
    </MemoryRouter>,
  );

const futureDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /register driver/i }));
}

describe('DriverForm — field validation (S4)', () => {
  beforeEach(() => createMock.mockClear());

  // WEB-VAL-04 (invalid): name must be letters only.
  it('rejects a name containing digits', () => {
    renderForm();
    fill(/driver full name/i, '123');
    fill(/driver license number/i, 'B1234567');
    fill(/license expiry date/i, futureDate(90));
    fill(/phone number/i, '0771234567');
    submit();

    expect(screen.getByText(/only contain letters/i)).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });

  // WEB-VAL-05 (invalid): phone must be exactly 10 digits.
  it('rejects a phone that is not 10 digits', () => {
    renderForm();
    fill(/driver full name/i, 'Kamal Perera');
    fill(/driver license number/i, 'B1234567');
    fill(/license expiry date/i, futureDate(90));
    fill(/phone number/i, '123');
    submit();

    expect(screen.getByText(/exactly 10 digits/i)).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });

  // WEB-VAL-06 (boundary): licence must be valid for more than 1 month.
  it('rejects a licence expiring within one month', () => {
    renderForm();
    fill(/driver full name/i, 'Kamal Perera');
    fill(/driver license number/i, 'B1234567');
    fill(/license expiry date/i, futureDate(10)); // < 1 month
    fill(/phone number/i, '0771234567');
    submit();

    expect(screen.getByText(/more than 1 month/i)).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });

  // WEB-VAL-07 (valid): a fully valid form submits.
  it('submits when all fields are valid', () => {
    renderForm();
    fill(/driver full name/i, 'Kamal Perera');
    fill(/driver license number/i, 'B1234567');
    fill(/license expiry date/i, futureDate(90));
    fill(/phone number/i, '0771234567');
    submit();

    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
