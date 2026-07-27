import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfitabilityReportPage } from '../../reports/profitability/ProfitabilityReportPage';

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

describe('ProfitabilityReportPage', () => {
  const mockReportResponse = {
    success: true,
    data: {
      items: [
        { name: 'NIKE', totalQuantity: 15, totalRevenue: 1500, totalCost: 1000, grossProfit: 500, profitMarginPercentage: 33.33 },
        { name: 'ADIDAS', totalQuantity: 10, totalRevenue: 800, totalCost: 900, grossProfit: -100, profitMarginPercentage: -12.5 },
      ],
      totals: {
        totalQuantity: 25,
        totalRevenue: 2300,
        totalCost: 1900,
        grossProfit: 400,
        profitMarginPercentage: 17.39
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ProfitabilityReportPage />);
    
    expect(screen.getByText('Reporte de Rentabilidad')).toBeDefined();
    expect(screen.getByText(/Seleccione sus filtros y presione "Aplicar Filtros"/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toHaveProperty('disabled', true);
  });

  it('fetches and renders report data correctly', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockReportResponse });
    
    render(<ProfitabilityReportPage />);
    
    const applyButton = screen.getByRole('button', { name: /Aplicar Filtros/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/profitability?groupBy=brand');
    });

    // Check if table renders data
    expect(screen.getByText('NIKE')).toBeDefined();
    expect(screen.getByText('ADIDAS')).toBeDefined();
    expect(screen.getByText(/TOTALES DEL REPORTE/i)).toBeDefined();
  });

  it('displays negative margins in red using conditional classes', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockReportResponse });
    render(<ProfitabilityReportPage />);
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));

    await waitFor(() => {
      expect(screen.getByText('-12.50%')).toBeDefined();
    });

    const negativeMarginCell = screen.getByText('-12.50%').closest('td');
    expect(negativeMarginCell?.className).toContain('text-red-600');
  });

  it('triggers CSV download on export click', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({ data: mockReportResponse });
    
    // Mock URL.createObjectURL and document body appendChild for downloading
    const mockCreateObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tag) => {
      const element = originalCreateElement.call(document, tag);
      if (tag === 'a') {
        element.click = mockClick;
      }
      return element;
    });

    render(<ProfitabilityReportPage />);
    
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));
    await waitFor(() => {
      expect(screen.getByText('NIKE')).toBeDefined();
    });

    const exportButton = screen.getByRole('button', { name: /Exportar CSV/i });
    expect(exportButton).toHaveProperty('disabled', false);
    
    fireEvent.click(exportButton);
    expect(mockClick).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Reporte exportado exitosamente.');
    
    document.createElement = originalCreateElement;
  });

  it('shows error toast on API failure', async () => {
    (axiosInstance.get as any).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Error de servidor' } }
    });

    render(<ProfitabilityReportPage />);
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error de servidor');
    });
  });
});
