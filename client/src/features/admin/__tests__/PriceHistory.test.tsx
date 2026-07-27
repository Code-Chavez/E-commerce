import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceHistory } from '../components/PriceHistory';
import axiosInstance from '@/shared/api/axiosInstance';

vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}));


const mockGet = vi.mocked(axiosInstance.get);

const mockHistoryData = [
  {
    id: 1,
    variantId: 15,
    userId: 1,
    oldPrice: 100,
    newPrice: 120,
    createdAt: '2026-07-13T10:00:00.000Z',
    user: { id: 1, name: 'Carlos Perez', email: 'carlos@test.com' },
  },
  {
    id: 2,
    variantId: 16,
    userId: null,
    oldPrice: 50,
    newPrice: 65,
    createdAt: '2026-07-12T08:30:00.000Z',
    user: null,
  },
];

describe('PriceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching data', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = render(<PriceHistory productId={1} />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders table with correct data on successful fetch', async () => {
    mockGet.mockResolvedValue({ data: { data: mockHistoryData } });
    render(<PriceHistory productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Perez')).toBeInTheDocument();
    });

    expect(screen.getByText('#15')).toBeInTheDocument();
    expect(screen.getByText('S/ 100.00')).toBeInTheDocument();
    expect(screen.getByText('S/ 120.00')).toBeInTheDocument();
    expect(screen.getByText('#16')).toBeInTheDocument();
  });

  it('shows "Sistema" when user is null', async () => {
    mockGet.mockResolvedValue({ data: { data: mockHistoryData } });
    render(<PriceHistory productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Sistema')).toBeInTheDocument();
    });
  });

  it('shows empty message when no records exist', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    render(<PriceHistory productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('No hay registros de cambios de precio para este producto.')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<PriceHistory productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar el historial de precios.')).toBeInTheDocument();
    });
  });
});
