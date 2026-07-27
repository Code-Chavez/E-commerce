import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientCommunicationsTab } from '../components/ClientCommunicationsTab';
import axiosInstance from '@/shared/api/axiosInstance';

vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

const mockCommunicationsData = {
  success: true,
  data: [
    {
      id: 1,
      userId: 5,
      channel: 'EMAIL',
      subject: 'Confirmación de Compra - Pedido #10023',
      type: 'TRANSACTIONAL',
      sentAt: '2026-07-06T10:00:00.000Z',
    },
    {
      id: 2,
      userId: 5,
      channel: 'WHATSAPP',
      subject: '¡Tu pedido está en camino!',
      type: 'TRANSACTIONAL',
      sentAt: '2026-07-06T10:05:00.000Z',
    },
  ],
};

describe('ClientCommunicationsTab Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially on mount', async () => {
    vi.mocked(axiosInstance.get).mockImplementationOnce(() => new Promise(() => {})); // never resolves
    render(<ClientCommunicationsTab clientId={5} />);
    
    expect(screen.getByText('Cargando historial de comunicaciones...')).toBeInTheDocument();
  });

  it('fetches and renders communication logs in table', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockCommunicationsData });
    render(<ClientCommunicationsTab clientId={5} />);

    expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/clients/5/communications');

    await waitFor(() => {
      expect(screen.getByText('Confirmación de Compra - Pedido #10023')).toBeInTheDocument();
      expect(screen.getByText('¡Tu pedido está en camino!')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });
  });

  it('displays empty state if communication logs are empty', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { success: true, data: [] } });
    render(<ClientCommunicationsTab clientId={5} />);

    await waitFor(() => {
      expect(screen.getByText('Sin Comunicaciones')).toBeInTheDocument();
      expect(screen.getByText(/No se han registrado correos ni mensajes/i)).toBeInTheDocument();
    });
  });

  it('displays error component if API call fails and supports retry', async () => {
    vi.mocked(axiosInstance.get)
      .mockRejectedValueOnce(new Error('Network Error')) // first fails
      .mockResolvedValueOnce({ data: mockCommunicationsData }); // retry succeeds

    render(<ClientCommunicationsTab clientId={5} />);

    await waitFor(() => {
      expect(screen.getByText('Error al Cargar Comunicaciones')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Reintentar Carga/i });
    fireEvent.click(retryBtn);

    expect(screen.getByText('Cargando historial de comunicaciones...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Confirmación de Compra - Pedido #10023')).toBeInTheDocument();
    });
  });
});
