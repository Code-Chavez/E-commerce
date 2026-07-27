import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterAdminPage } from '../NewsletterAdminPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { adminNewsletterService } from '../services/adminNewsletterService';

vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../services/adminNewsletterService', () => ({
  adminNewsletterService: {
    getSubscribers: vi.fn(),
    exportSubscribers: vi.fn(),
  },
}));

const mockSubscribersData = {
  success: true,
  data: [
    {
      id: 1,
      email: 'suscrito1@test.com',
      isActive: true,
      subscribedAt: '2026-07-06T14:00:00.000Z',
    },
    {
      id: 2,
      email: 'suscrito2@test.com',
      isActive: true,
      subscribedAt: '2026-07-07T15:30:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
};

describe('NewsletterAdminPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially on mount', async () => {
    vi.mocked(adminNewsletterService.getSubscribers).mockImplementationOnce(
      () => new Promise(() => {}) // Nunca resuelve para emular carga
    );

    const { container } = render(<NewsletterAdminPage />);
    
    // Verifica que existe la clase animate-pulse en los skeletons de carga
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('fetches and renders subscribers list in table', async () => {
    vi.mocked(adminNewsletterService.getSubscribers).mockResolvedValueOnce(mockSubscribersData);

    render(<NewsletterAdminPage />);

    expect(adminNewsletterService.getSubscribers).toHaveBeenCalledWith({ page: 1, limit: 10 });

    await waitFor(() => {
      expect(screen.getByText('suscrito1@test.com')).toBeInTheDocument();
      expect(screen.getByText('suscrito2@test.com')).toBeInTheDocument();
      expect(screen.getByText('2 activos')).toBeInTheDocument();
    });
  });

  it('displays empty state when list is empty', async () => {
    vi.mocked(adminNewsletterService.getSubscribers).mockResolvedValueOnce({
      success: true,
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });

    render(<NewsletterAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Sin Suscriptores')).toBeInTheDocument();
      expect(screen.getByText('Aún no hay usuarios suscritos de forma activa al newsletter.')).toBeInTheDocument();
    });
  });

  it('displays error message and supports retry on API failure', async () => {
    vi.mocked(adminNewsletterService.getSubscribers)
      .mockRejectedValueOnce(new Error('Network error fetching subscribers'))
      .mockResolvedValueOnce(mockSubscribersData); // Para el reintento

    render(<NewsletterAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Error al Cargar Suscriptores')).toBeInTheDocument();
      expect(screen.getByText('Network error fetching subscribers')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Reintentar Carga/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('suscrito1@test.com')).toBeInTheDocument();
    });
  });

  it('triggers CSV export when clicking the CSV export button', async () => {
    vi.mocked(adminNewsletterService.getSubscribers).mockResolvedValueOnce(mockSubscribersData);
    vi.mocked(adminNewsletterService.exportSubscribers).mockResolvedValueOnce();

    render(<NewsletterAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('suscrito1@test.com')).toBeInTheDocument();
    });

    const exportCsvBtn = screen.getByRole('button', { name: /Exportar CSV/i });
    fireEvent.click(exportCsvBtn);

    expect(adminNewsletterService.exportSubscribers).toHaveBeenCalledWith('csv');
  });

  it('triggers Excel export when clicking the Excel export button', async () => {
    vi.mocked(adminNewsletterService.getSubscribers).mockResolvedValueOnce(mockSubscribersData);
    vi.mocked(adminNewsletterService.exportSubscribers).mockResolvedValueOnce();

    render(<NewsletterAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('suscrito1@test.com')).toBeInTheDocument();
    });

    const exportExcelBtn = screen.getByRole('button', { name: /Exportar Excel/i });
    fireEvent.click(exportExcelBtn);

    expect(adminNewsletterService.exportSubscribers).toHaveBeenCalledWith('excel');
  });
});
