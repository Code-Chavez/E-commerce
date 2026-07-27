import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemandForecastPage } from '../DemandForecastPage';
import { DemandForecastTable } from '../components/reports/DemandForecastTable';
import { RestockSuggestionsTable } from '../components/reports/RestockSuggestionsTable';
import axiosInstance from '@/shared/api/axiosInstance';
import { exportRestockSuggestionsToCSV } from '../utils/csvExport';

vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/csvExport', () => ({
  exportRestockSuggestionsToCSV: vi.fn(),
}));

const mockForecastData = {
  success: true,
  data: [
    {
      categoryName: 'Polos',
      size: 'M',
      projectedDemand: 7.5
    }
  ]
};

const mockSuggestionsData = {
  success: true,
  data: [
    {
      variantId: 1,
      suggestedQty: 8,
      currentStock: 2
    }
  ]
};

describe('Demand Forecast and Restock Suggestions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DemandForecastTable Component', () => {
    it('renders the forecast items correctly', () => {
      render(<DemandForecastTable items={mockForecastData.data} />);
      expect(screen.getByText('Polos')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('7.5 und.')).toBeInTheDocument();
    });

    it('renders empty state when no items exist', () => {
      render(<DemandForecastTable items={[]} />);
      expect(screen.getByText('No se encontraron predicciones')).toBeInTheDocument();
    });
  });

  describe('RestockSuggestionsTable Component', () => {
    it('renders suggestions items correctly', () => {
      render(<RestockSuggestionsTable items={mockSuggestionsData.data} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('2 und.')).toBeInTheDocument();
      expect(screen.getByText('+8 und.')).toBeInTheDocument();
    });

    it('renders empty state when no items exist', () => {
      render(<RestockSuggestionsTable items={[]} />);
      expect(screen.getByText('No hay sugerencias de abastecimiento')).toBeInTheDocument();
    });
  });

  describe('DemandForecastPage Integration Tests', () => {
    it('fetches and displays both reports on mount', async () => {
      vi.mocked(axiosInstance.get)
        .mockResolvedValueOnce({ data: mockForecastData })
        .mockResolvedValueOnce({ data: mockSuggestionsData });

      render(<DemandForecastPage />);

      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/demand-forecast', {
          params: { months: 1 }
        });
        expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/restock-suggestions', {
          params: { months: 1 }
        });
      });

      expect(screen.getByText('Polos')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('calls export CSV utility on button click', async () => {
      vi.mocked(axiosInstance.get)
        .mockResolvedValueOnce({ data: mockForecastData })
        .mockResolvedValueOnce({ data: mockSuggestionsData });

      render(<DemandForecastPage />);

      await waitFor(() => {
        expect(screen.getByText('Polos')).toBeInTheDocument();
      });

      const exportBtn = screen.getByText('Exportar Sugerencias');
      fireEvent.click(exportBtn);

      expect(exportRestockSuggestionsToCSV).toHaveBeenCalledWith(mockSuggestionsData.data, 1);
    });
  });
});
