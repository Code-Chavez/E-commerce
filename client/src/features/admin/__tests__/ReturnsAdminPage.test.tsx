import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { ReturnsAdminPage } from '../returns/ReturnsAdminPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { Toaster } from 'react-hot-toast';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockReturns = [
  {
    id: 1,
    orderId: 100,
    reason: 'Talla incorrecta',
    status: 'PENDING',
    refundType: 'CREDIT_NOTE',
    user: { name: 'Juan Pérez', email: 'juan@test.com' },
    rawItems: [{ id: 1 }],
  },
  {
    id: 2,
    orderId: 200,
    reason: 'Producto dañado',
    status: 'APPROVED',
    refundType: 'STORE_CREDIT',
    user: { name: 'María López', email: 'maria@test.com' },
    rawItems: [{ id: 2 }],
  },
];

const renderPage = () =>
  render(
    <HelmetProvider>
      <ReturnsAdminPage />
      <Toaster />
    </HelmetProvider>
  );

describe('ReturnsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axiosInstance.get as any).mockResolvedValue({
      data: { success: true, data: mockReturns },
    });
  });

  it('renders the returns list with status badges', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  it('shows approve/reject buttons only for PENDING returns', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Aprobar');
    const rejectButtons = screen.getAllByText('Rechazar');
    expect(approveButtons).toHaveLength(1);
    expect(rejectButtons).toHaveLength(1);
  });

  it('shows toast with pickupOrderId after successful approval', async () => {
    (axiosInstance.patch as any).mockResolvedValue({
      data: { success: true, data: { id: 1, status: 'APPROVED', pickupOrderId: 42 } },
    });
    (axiosInstance.post as any).mockResolvedValue({
      data: { success: true, data: {} },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aprobar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aprobar'));

    // Confirm in modal
    const confirmBtn = await screen.findByText('Sí, Aprobar');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith('/v1/admin/returns/1/approve');
    });

    await waitFor(() => {
      expect(screen.getByText(/Orden de Recojo #42 generada/)).toBeInTheDocument();
    });
  });

  it('shows error toast on approval failure', async () => {
    (axiosInstance.patch as any).mockRejectedValue({
      response: { data: { error: 'Devolución ya fue procesada' } },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aprobar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aprobar'));
    const confirmBtn = await screen.findByText('Sí, Aprobar');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Devolución ya fue procesada').length).toBeGreaterThan(0);
    });
  });

  it('shows confirmation modal with pickup order message', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aprobar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aprobar'));

    await waitFor(() => {
      expect(screen.getByText(/Orden de Recojo para retirar los productos/)).toBeInTheDocument();
    });
  });
});
