import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoyaltyConfigPage from '../LoyaltyConfigPage';
import { loyaltyAdminService } from '../services/loyalty.service';
import { toast } from 'react-hot-toast';

jest.mock('../services/loyalty.service');
jest.mock('react-hot-toast');

describe('LoyaltyConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (loyaltyAdminService.getLoyaltyConfig as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<LoyaltyConfigPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('loads and displays current config', async () => {
    (loyaltyAdminService.getLoyaltyConfig as jest.Mock).mockResolvedValue({ solesPerPoint: 10, isActive: true });
    render(<LoyaltyConfigPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Soles por cada Punto/i)).toHaveValue(10);
    });
  });

  it('shows error if saving invalid value', async () => {
    (loyaltyAdminService.getLoyaltyConfig as jest.Mock).mockResolvedValue({ solesPerPoint: 10 });
    render(<LoyaltyConfigPage />);
    
    await waitFor(() => expect(screen.getByLabelText(/Soles por cada Punto/i)).toHaveValue(10));
    
    fireEvent.change(screen.getByLabelText(/Soles por cada Punto/i), { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Configuración/i }));

    expect(toast.error).toHaveBeenCalledWith('El valor debe ser un número mayor a 0');
    expect(loyaltyAdminService.updateLoyaltyConfig).not.toHaveBeenCalled();
  });

  it('saves new config successfully', async () => {
    (loyaltyAdminService.getLoyaltyConfig as jest.Mock).mockResolvedValue({ solesPerPoint: 10 });
    (loyaltyAdminService.updateLoyaltyConfig as jest.Mock).mockResolvedValue({ solesPerPoint: 5, isActive: true });
    
    render(<LoyaltyConfigPage />);
    
    await waitFor(() => expect(screen.getByLabelText(/Soles por cada Punto/i)).toHaveValue(10));
    
    fireEvent.change(screen.getByLabelText(/Soles por cada Punto/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Configuración/i }));

    await waitFor(() => {
      expect(loyaltyAdminService.updateLoyaltyConfig).toHaveBeenCalledWith({ solesPerPoint: 5 });
      expect(toast.success).toHaveBeenCalledWith('Regla de acumulación actualizada exitosamente');
    });
  });
});
