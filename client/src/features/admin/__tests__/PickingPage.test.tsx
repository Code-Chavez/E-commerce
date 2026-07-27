import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import PickingPage from '../PickingPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { Toaster } from 'react-hot-toast';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock del axiosInstance
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Setup de pruebas
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      {ui}
      <Toaster />
    </HelmetProvider>
  );
};

describe('PickingPage', () => {
  const mockDeliveries = [
    { id: 101, orderId: 1001, status: 'PENDING', createdAt: '2026-07-01T10:00:00Z', pickingItems: [{ id: 1, qty: 3, productName: 'Camisa', variantSku: 'SKU-001' }] },
    { id: 102, orderId: 1002, status: 'PENDING', createdAt: '2026-07-01T10:00:00Z', pickingItems: [{ id: 2, qty: 1, productName: 'Pantalón', variantSku: 'SKU-002' }] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (axiosInstance.get as any).mockResolvedValue({
      data: { success: true, data: mockDeliveries }
    });
  });

  it('debe renderizar el título, la tabla y los despachos pendientes (picking lists)', async () => {
    renderWithProviders(<PickingPage />);
    
    // Verifica que el título esté en pantalla
    expect(screen.getByText('Listas de Picking (Despachos)')).toBeInTheDocument();
    
    // Debería resolverse de la API simulada (buscamos por ID de pedido)
    expect(await screen.findByText('#1001')).toBeInTheDocument();
    expect(screen.getByText('#1002')).toBeInTheDocument();
    
    // Verificar que llama a la ruta correcta con status PENDING
    expect(axiosInstance.get).toHaveBeenCalledWith('/v1/logistics/deliveries', { params: { status: 'PENDING' } });
  });

  it('debe mostrar mensaje vacío si no hay listas de picking generadas', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({
      data: { success: true, data: [] }
    });

    renderWithProviders(<PickingPage />);
    
    expect(await screen.findByText('No hay listas de picking generadas (despachos pendientes).')).toBeInTheDocument();
  });
});

