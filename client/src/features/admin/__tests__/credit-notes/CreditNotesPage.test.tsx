import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditNotesPage } from '../../credit-notes/CreditNotesPage';

// Mock axiosInstance
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axiosInstance from '@/shared/api/axiosInstance';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

describe('CreditNotesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCreditNotes = [
    {
      id: 1,
      returnRequestId: 10,
      amount: 50.00,
      type: 'CREDIT_NOTE',
      code: 'NC-1001',
      usedAt: null,
      createdAt: '2026-07-02T12:00:00.000Z',
      client: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    {
      id: 2,
      returnRequestId: 11,
      amount: 100.00,
      type: 'STORE_CREDIT',
      code: 'NC-1002',
      usedAt: '2026-07-02T13:00:00.000Z',
      createdAt: '2026-07-02T12:30:00.000Z',
      client: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
  ];

  it('renders loading state and then displays credit notes', async () => {
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: mockCreditNotes,
      },
    });

    render(<CreditNotesPage />);

    // Loader should be shown
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getByText('NC-1001')).toBeInTheDocument();
      expect(screen.getByText('NC-1002')).toBeInTheDocument();
    });

    // Check customer names and amounts
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('S/ 50.00')).toBeInTheDocument();
    expect(screen.getByText('S/ 100.00')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Usada')).toBeInTheDocument();
  });

  it('calls resend pdf endpoint and displays success toast', async () => {
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: mockCreditNotes,
      },
    });

    (axiosInstance.post as any).mockResolvedValue({
      data: { success: true },
    });

    render(<CreditNotesPage />);

    await waitFor(() => {
      expect(screen.getByText('NC-1001')).toBeInTheDocument();
    });

    // Trigger the resend PDF button for the first credit note
    const resendButtons = screen.getAllByText('Reenviar PDF');
    fireEvent.click(resendButtons[0]);

    // Check resending state text (should change button label to "Reenviando...")
    expect(screen.getByText('Reenviando...')).toBeInTheDocument();

    await waitFor(() => {
      // Assert endpoint was hit with correct ID
      expect(axiosInstance.post).toHaveBeenCalledWith('/v1/admin/credit-notes/1/resend');
      // Assert toast success was called
      expect(toast.success).toHaveBeenCalledWith('PDF reenviado con éxito al cliente');
    });
  });

  it('displays error toast when resend pdf endpoint fails', async () => {
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: mockCreditNotes,
      },
    });

    const mockErrorMessage = 'Error del servidor de correos';
    (axiosInstance.post as any).mockRejectedValue({
      response: {
        data: {
          error: mockErrorMessage,
        },
      },
    });

    render(<CreditNotesPage />);

    await waitFor(() => {
      expect(screen.getByText('NC-1001')).toBeInTheDocument();
    });

    const resendButtons = screen.getAllByText('Reenviar PDF');
    fireEvent.click(resendButtons[0]);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/v1/admin/credit-notes/1/resend');
      expect(toast.error).toHaveBeenCalledWith(mockErrorMessage);
    });
  });
});
