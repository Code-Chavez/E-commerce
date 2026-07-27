import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import DeliveriesPage from '../DeliveriesPage';
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
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      {ui}
      <Toaster />
    </HelmetProvider>
  );
};

describe('DeliveriesPage', () => {
  const mockDeliveries = [
    { id: 101, orderId: 1001, deliveryManId: null, status: 'PENDING', createdAt: '2026-07-01T10:00:00Z', pickingItems: [], type: 'DELIVERY' },
    { id: 102, orderId: 1002, deliveryManId: 99, status: 'ASSIGNED', createdAt: '2026-07-01T10:00:00Z', pickingItems: [], type: 'DELIVERY' },
    { id: 103, orderId: 1003, deliveryManId: null, status: 'PENDING', createdAt: '2026-07-01T12:00:00Z', pickingItems: [], type: 'PICKUP', returnRequestId: 5 },
  ];

  const mockDeliveryMen = [
    { id: 99, name: 'Repartidor 99', email: 'rep99@test.com' },
    { id: 101, name: 'Repartidor 1', email: 'rep1@test.com' },
    { id: 102, name: 'Repartidor 2', email: 'rep2@test.com' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/delivery-men')) {
        return Promise.resolve({ data: { success: true, data: mockDeliveryMen } });
      }
      return Promise.resolve({ data: { success: true, data: mockDeliveries } });
    });
  });

  it('debe renderizar el título y las columnas del Kanban', async () => {
    renderWithProviders(<DeliveriesPage />);

    expect(screen.getByText('Control de Despachos')).toBeInTheDocument();

    // Deberían verse los despachos de la API
    expect(await screen.findByText('ENVÍO #101')).toBeInTheDocument();
    expect(screen.getByText('ENVÍO #102')).toBeInTheDocument();

    // Deben estar las columnas principales
    expect(screen.getByRole('heading', { name: /Pendiente/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Asignado/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /En Camino/i })).toBeInTheDocument();
  });

  it('debe mostrar RECOJO en lugar de ENVÍO para deliveries tipo PICKUP', async () => {
    renderWithProviders(<DeliveriesPage />);

    expect(await screen.findByText('RECOJO #103')).toBeInTheDocument();
    expect(screen.getByText('ENVÍO #101')).toBeInTheDocument();
    expect(screen.getByText('ENVÍO #102')).toBeInTheDocument();
  });

  it('debe abrir el panel de detalles al hacer clic en el botón de ver', async () => {
    renderWithProviders(<DeliveriesPage />);
    
    expect(await screen.findByText('ENVÍO #101')).toBeInTheDocument();
    
    // Encontrar el botón de ver dentro de la tarjeta de ENVÍO #101
    const card101 = screen.getByText('ENVÍO #101').closest('div');
    const viewBtn = card101?.querySelector('button');
    expect(viewBtn).toBeInTheDocument();
    
    fireEvent.click(viewBtn!);

    // Debe abrir el panel de detalles y mostrar información
    expect(screen.getByText('Detalle de Envío')).toBeInTheDocument();
    expect(screen.getByText('Pedido ID:')).toBeInTheDocument();
    expect(screen.getByText('#1001')).toBeInTheDocument();
  });

  it('debe descargar la etiqueta cuando está asignado y se solicita desde el panel de detalles', async () => {
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/label')) {
        return Promise.resolve({ data: new Blob() });
      }
      if (url.includes('/delivery-men')) {
        return Promise.resolve({ data: { success: true, data: mockDeliveryMen } });
      }
      return Promise.resolve({ data: { success: true, data: mockDeliveries } });
    });

    renderWithProviders(<DeliveriesPage />);
    
    expect(await screen.findByText('ENVÍO #102')).toBeInTheDocument();
    
    // Encontrar el botón de ver dentro de la tarjeta de ENVÍO #102
    const card102 = screen.getByText('ENVÍO #102').closest('div');
    const viewBtn = card102?.querySelector('button');
    expect(viewBtn).toBeInTheDocument();
    
    fireEvent.click(viewBtn!);

    // Esperar a que se abra el panel y buscar el botón de descargar
    const downloadBtn = await screen.findByRole('button', { name: /Descargar Guía de Envío/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/v1/logistics/deliveries/102/label', {
        responseType: 'blob'
      });
    });
  });
});
