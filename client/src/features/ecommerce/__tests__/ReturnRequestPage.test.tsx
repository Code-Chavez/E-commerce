import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReturnRequestPage from '../profile/ReturnRequestPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { Toaster } from 'react-hot-toast';

vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockOrder = {
  id: 123,
  status: 'DELIVERED',
  total: 250.0,
  shippingCost: 10.0,
  addressSnapshot: {
    alias: 'Casa',
    fullAddress: 'Calle Principal 123',
    district: 'Lima',
  },
  createdAt: '2026-07-01T10:00:00Z',
  items: [
    {
      id: 1,
      orderId: 123,
      variantId: 10,
      qty: 2,
      unitPrice: 100.0,
      variantSku: 'SKU123',
      productName: 'Producto A',
    },
  ],
};

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

const renderWithProviders = (orderId = '123') => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/profile/orders/${orderId}/return`]}>
        <Routes>
          <Route path="/profile/orders/:orderId/return" element={<ReturnRequestPage />} />
          <Route path="/profile/orders" element={<div>Orders History</div>} />
        </Routes>
      </MemoryRouter>
      <Toaster />
    </HelmetProvider>
  );
};

describe('ReturnRequestPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          orders: [mockOrder],
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    });
  });

  it('renders order details and items correctly', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Solicitar Devolución del Pedido #123")).toBeInTheDocument();
      expect(screen.getByText("Producto A")).toBeInTheDocument();
      expect(screen.getByText("SKU: SKU123")).toBeInTheDocument();
    });
  });

  it('enables the submit button only when form is valid (item selected and reason >= 10 chars)', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Producto A")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Enviar Solicitud de Devolución/i });
    expect(submitBtn).toBeDisabled();

    // Check item checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(submitBtn).toBeDisabled();

    // Fill short reason
    const textarea = screen.getByPlaceholderText(/Describe detalladamente el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Corto' } });
    expect(submitBtn).toBeDisabled();

    // Fill valid reason
    fireEvent.change(textarea, { target: { value: 'Motivo largo de prueba' } });
    expect(submitBtn).toBeEnabled();
  });

  it('submits the form successfully and calls the returns endpoint', async () => {
    (axiosInstance.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, status: 'PENDING' },
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Producto A")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const textarea = screen.getByPlaceholderText(/Describe detalladamente el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Motivo largo de prueba' } });

    const submitBtn = screen.getByRole('button', { name: /Enviar Solicitud de Devolución/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/v1/returns', {
        orderId: 123,
        reason: 'Motivo largo de prueba',
        refundType: 'CREDIT_NOTE',
        items: [
          {
            orderItemId: 1,
            qty: 1,
          },
        ],
      });
    });
  });
});
