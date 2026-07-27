import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoyaltyInput } from '../LoyaltyInput';
import { useLoyalty } from '../../profile/hooks/useLoyalty';

jest.mock('../../profile/hooks/useLoyalty');

describe('LoyaltyInput', () => {
  const mockOnLoyaltyApplied = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render if user has no points', () => {
    (useLoyalty as jest.Mock).mockReturnValue({
      account: { balance: 0 },
      fetchBalance: jest.fn(),
      isLoading: false
    });

    render(<LoyaltyInput maxAllowedDiscount={100} onLoyaltyApplied={mockOnLoyaltyApplied} />);
    expect(screen.queryByLabelText(/Canjear Puntos/i)).not.toBeInTheDocument();
  });

  it('renders input if user has points', () => {
    (useLoyalty as jest.Mock).mockReturnValue({
      account: { balance: 50 },
      fetchBalance: jest.fn(),
      isLoading: false
    });

    render(<LoyaltyInput maxAllowedDiscount={100} onLoyaltyApplied={mockOnLoyaltyApplied} />);
    expect(screen.getByText(/Canjear Puntos \(Disponibles: 50\)/i)).toBeInTheDocument();
  });

  it('shows error if trying to redeem more points than available', () => {
    (useLoyalty as jest.Mock).mockReturnValue({
      account: { balance: 50 },
      fetchBalance: jest.fn(),
      isLoading: false
    });

    render(<LoyaltyInput maxAllowedDiscount={100} onLoyaltyApplied={mockOnLoyaltyApplied} />);
    
    const input = screen.getByPlaceholderText('Cant. de puntos');
    fireEvent.change(input, { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    expect(screen.getByText(/Solo tienes 50 puntos disponibles./i)).toBeInTheDocument();
    expect(mockOnLoyaltyApplied).not.toHaveBeenCalled();
  });

  it('applies points successfully', () => {
    (useLoyalty as jest.Mock).mockReturnValue({
      account: { balance: 50 },
      fetchBalance: jest.fn(),
      isLoading: false
    });

    render(<LoyaltyInput maxAllowedDiscount={100} onLoyaltyApplied={mockOnLoyaltyApplied} />);
    
    const input = screen.getByPlaceholderText('Cant. de puntos');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    expect(mockOnLoyaltyApplied).toHaveBeenCalledWith(20, 20);
    expect(screen.getByText(/20 Puntos canjeados/i)).toBeInTheDocument();
  });
});
