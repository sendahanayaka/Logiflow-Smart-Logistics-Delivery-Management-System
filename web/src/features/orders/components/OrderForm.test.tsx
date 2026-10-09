import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderForm } from './OrderForm';

// Fill the numeric fields so the dimensions check passes and validation reaches
// the recipient rules under test.
function setPositiveDimensions(container: HTMLElement) {
  for (const name of ['weightKg', 'lengthCm', 'widthCm', 'heightCm']) {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1' } });
  }
}

function setValue(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

describe('OrderForm — recipient form validation (S4)', () => {
  // WEB-VAL-01 (invalid): recipient name is required.
  it('blocks submit and shows an error when recipient name is empty', () => {
    const onSubmit = vi.fn();
    const { container } = render(<OrderForm onSubmit={onSubmit} isLoading={false} />);
    setPositiveDimensions(container);
    setValue(container, 'recipientContact', '0771234567');
    // recipientName left empty

    fireEvent.submit(container.querySelector('form')!);

    expect(screen.getByText('Recipient name is required.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // WEB-VAL-02 (invalid): recipient contact must be exactly 10 digits.
  it('blocks submit when recipient contact is not a 10-digit phone', () => {
    const onSubmit = vi.fn();
    const { container } = render(<OrderForm onSubmit={onSubmit} isLoading={false} />);
    setPositiveDimensions(container);
    setValue(container, 'recipientName', 'Kasun Perera');
    setValue(container, 'recipientContact', '123'); // too short

    fireEvent.submit(container.querySelector('form')!);

    expect(screen.getByText('Recipient contact must be a 10-digit phone number.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // WEB-VAL-03 (valid): valid recipient details let the submit through.
  it('submits when dimensions and recipient details are valid', () => {
    const onSubmit = vi.fn();
    const { container } = render(<OrderForm onSubmit={onSubmit} isLoading={false} />);
    setPositiveDimensions(container);
    setValue(container, 'recipientName', 'Kasun Perera');
    setValue(container, 'recipientContact', '0771234567');

    fireEvent.submit(container.querySelector('form')!);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
