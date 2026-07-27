import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialDashboardPage } from '../../reports/financial-dashboard/FinancialDashboardPage';

// Mock axiosInstance
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}));
import axiosInstance from '@/shared/api/axiosInstance';

// Mock useDocumentTitle
vi.mock('@/shared/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
import toast from 'react-hot-toast';

// Mock ResizeObserver for Recharts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

describe('FinancialDashboardPage', () => {
  const mockDashboardResponse = {
    success: true,
    data: {
      currentPeriod: {
        totalRevenue: 25000,
        posRevenue: 18000,
        ecommerceRevenue: 7000,
        revenueByBranch: [
          { branchId: 1, branchName: 'Sede Principal', total: 18000 },
          { branchId: null, branchName: 'Venta Online', total: 7000 }
        ]
      },
      previousPeriod: {
        totalRevenue: 20000,
        posRevenue: 15000,
        ecommerceRevenue: 5000,
        revenueByBranch: [
          { branchId: 1, branchName: 'Sede Principal', total: 15000 },
          { branchId: null, branchName: 'Venta Online', total: 5000 }
        ]
      },
      comparison: {
        revenueDifference: 5000,
        revenuePercentageChange: 25
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loaders initially and then renders loaded metrics', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockDashboardResponse });
    
    render(<FinancialDashboardPage />);
    
    expect(screen.getByText(/Cargando reporte financiero/i)).toBeDefined();

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/financial-dashboard?');
    });

    expect(screen.getAllByText(/25,000/)).toBeDefined(); // Total current revenue
    expect(screen.getAllByText(/18,000/)).toBeDefined(); // POS current revenue
    expect(screen.getAllByText(/7,000/)).toBeDefined(); // Ecommerce current revenue
    expect(screen.getByText('Sede Principal')).toBeDefined();
    expect(screen.getByText('Venta Online')).toBeDefined();
  });

  it('triggers filter query on date application', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockDashboardResponse });
    render(<FinancialDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/25,000/)).toBeDefined();
    });

    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockDashboardResponse });

    // Fill dates
    const fromInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const toInput = document.querySelectorAll('input[type="date"]')[1] as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: '2026-06-01' } });
    fireEvent.change(toInput, { target: { value: '2026-06-30' } });

    const applyButton = screen.getByRole('button', { name: /Aplicar Filtros/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/financial-dashboard?from=2026-06-01&to=2026-06-30');
    });
  });

  it('handles API failure correctly displaying toast message', async () => {
    const mockError = new Error('Acceso denegado') as any;
    mockError.isAxiosError = true;
    mockError.response = { data: { error: { message: 'Acceso denegado: Se requiere el permiso sales:read' } } };
    (axiosInstance.get as any).mockRejectedValueOnce(mockError);

    render(<FinancialDashboardPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Acceso denegado: Se requiere el permiso sales:read');
    });
  });
});
