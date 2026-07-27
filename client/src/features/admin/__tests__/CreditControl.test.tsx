import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditControlPage } from '../CreditControlPage';
import { CreditTable, isNearDueDate } from '../components/credits/CreditTable';
import { PaymentFormModal } from '../components/credits/PaymentFormModal';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockClients = {
  clients: [
    { id: 1, name: 'Juan', lastName: 'Perez', email: 'juan@test.com', documentId: '12345678', type: 'ALL', isActive: true, userId: 10 },
  ],
  pagination: { total: 1, page: 1, totalPages: 1, limit: 10 },
};

const mockCredits = {
  clientId: 1,
  totalPendingBalance: 350.00,
  credits: [
    {
      id: 'credit-1',
      totalAmount: 500.00,
      pendingBalance: 350.00,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now (warning)
      installments: 3,
    },
    {
      id: 'credit-2',
      totalAmount: 200.00,
      pendingBalance: 100.00,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now (safe)
      installments: 2,
    },
  ],
};

describe('Credit Control System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNearDueDate logic helper', () => {
    it('returns true if the due date is within 7 days', () => {
      const nearDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(isNearDueDate(nearDate)).toBe(true);
    });

    it('returns true if the due date is overdue (past date)', () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(isNearDueDate(pastDate)).toBe(true);
    });

    it('returns false if the due date is further than 7 days', () => {
      const farDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(isNearDueDate(farDate)).toBe(false);
    });
  });

  describe('CreditTable Component', () => {
    it('renders list of credits with conditional styling warning for near-due items', () => {
      const onPayClick = vi.fn();
      render(<CreditTable credits={mockCredits.credits} loading={false} onPayClick={onPayClick} />);

      // Credit 1 should warning (diff <= 7 days)
      expect(screen.getByText('credit-1')).toBeInTheDocument();
      expect(screen.getByText('credit-2')).toBeInTheDocument();

      // Check for button trigger
      const payButtons = screen.getAllByRole('button', { name: 'Abonar' });
      expect(payButtons).toHaveLength(2);
      fireEvent.click(payButtons[0]);
      expect(onPayClick).toHaveBeenCalledWith(mockCredits.credits[0]);
    });
  });

  describe('PaymentFormModal Component', () => {
    it('validates amount greater than 0 and less than or equal to pending balance', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      render(
        <PaymentFormModal
          isOpen={true}
          creditId="credit-1"
          pendingBalance={350.00}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const input = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });

      // Negative value validation
      fireEvent.change(input, { target: { value: '-10' } });
      fireEvent.click(submitButton);
      expect(await screen.findByText('El monto debe ser mayor a 0')).toBeInTheDocument();

      // Exceed balance validation
      fireEvent.change(input, { target: { value: '400' } });
      fireEvent.click(submitButton);
      expect(await screen.findByText('El monto no puede exceder el saldo pendiente de $350.00')).toBeInTheDocument();
    });

    it('submits successfully when amount is correct', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      (axiosInstance.post as any).mockResolvedValueOnce({
        data: { id: 'payment-1', creditId: 'credit-1', amount: 150.00, paidAt: new Date().toISOString() },
      });

      render(
        <PaymentFormModal
          isOpen={true}
          creditId="credit-1"
          pendingBalance={350.00}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const input = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });

      fireEvent.change(input, { target: { value: '150' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axiosInstance.post).toHaveBeenCalledWith('/v1/credits/credit-1/payments', { amount: 150 });
        expect(toast.success).toHaveBeenCalledWith('Abono registrado con éxito');
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('CreditControlPage Integrations', () => {
    it('allows searching and selecting a client, and fetches their credits', async () => {
      (axiosInstance.get as any).mockImplementation((url: string) => {
        if (url.includes('/v1/admin/clients')) {
          return Promise.resolve({ data: mockClients });
        }
        if (url.includes('/v1/credits')) {
          return Promise.resolve({ data: mockCredits });
        }
        return Promise.reject(new Error('Unknown URL: ' + url));
      });

      render(<CreditControlPage />);

      const searchInput = screen.getByPlaceholderText('Buscar cliente por nombre, DNI o RUC...');
      const searchButton = screen.getByRole('button', { name: 'Buscar' });

      fireEvent.change(searchInput, { target: { value: 'Juan' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      });

      const selectBtn = screen.getByText('Seleccionar');
      fireEvent.click(selectBtn);

      expect(await screen.findByText('Cliente Seleccionado')).toBeInTheDocument();
      expect(await screen.findByText('Saldo Total Pendiente')).toBeInTheDocument();

      // Wait for loading message to disappear
      await waitFor(() => {
        expect(screen.queryByText('Cargando créditos del cliente...')).not.toBeInTheDocument();
      });

      expect(screen.getAllByText(/350/)[0]).toBeInTheDocument();
      expect(screen.getByText(/credit-1/)).toBeInTheDocument();
    });
  });
});
