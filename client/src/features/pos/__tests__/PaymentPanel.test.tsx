import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentPanel } from '../components/PaymentPanel';

describe('PaymentPanel (HU-036 Audit Fix)', () => {
  it('should render receipt type options', () => {
    render(<PaymentPanel totalAmount={100} onConfirm={vi.fn()} />);
    
    expect(screen.getByText('TICKET')).toBeInTheDocument();
    expect(screen.getByText('BOLETA')).toBeInTheDocument();
    expect(screen.getByText('FACTURA')).toBeInTheDocument();
  });

  it('should select TICKET by default', () => {
    render(<PaymentPanel totalAmount={100} onConfirm={vi.fn()} />);
    
    const ticketButton = screen.getByText('TICKET');
    expect(ticketButton.className).toContain('bg-[#3F3F3F]'); // active state color
  });

  it('should pass selected receipt type to onConfirm', () => {
    const handleConfirm = vi.fn();
    render(<PaymentPanel totalAmount={100} onConfirm={handleConfirm} />);
    
    // Switch to FACTURA
    fireEvent.click(screen.getByText('FACTURA'));
    
    // Add payment to enable confirm button
    const amountInput = screen.getByPlaceholderText('100.00');
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(screen.getByText('Añadir'));
    
    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /confirmar venta/i }));
    
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ amount: 100 })]),
      'FACTURA'
    );
  });
});
