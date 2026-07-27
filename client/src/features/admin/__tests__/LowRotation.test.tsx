import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LowRotationPage } from '../LowRotationPage';
import { LowRotationTable } from '../components/reports/LowRotationTable';
import { LowRotationFilters } from '../components/reports/LowRotationFilters';
import axiosInstance from '@/shared/api/axiosInstance';
import { exportLowRotationToCSV } from '../utils/csvExport';

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
  exportLowRotationToCSV: vi.fn(),
}));

const mockLowRotationData = {
  success: true,
  data: [
    {
      variantId: 'var-1',
      sku: 'CAM-001-M-BLA',
      productName: 'Camisa Casual',
      attributes: { Talla: 'M', Color: 'Blanco' },
      daysWithoutMovement: 105,
      lastMovementDate: '2025-10-15T00:00:00.000Z',
      currentStock: 15,
    },
    {
      variantId: 'var-2',
      sku: 'PNT-002-32-NE',
      productName: 'Pantalon Jean',
      attributes: { Talla: '32', Color: 'Negro' },
      daysWithoutMovement: 60,
      lastMovementDate: '2025-11-15T00:00:00.000Z',
      currentStock: 4,
    },
  ],
};

describe('Low Rotation Products Report Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LowRotationFilters Component', () => {
    it('calls onSearch with parsed days when form is submitted', () => {
      const onSearchMock = vi.fn();
      render(<LowRotationFilters onSearch={onSearchMock} isLoading={false} defaultDays={90} />);

      const input = screen.getByLabelText(/Periodo sin Venta/i);
      const submitButton = screen.getByRole('button', { name: /Generar Reporte/i });

      fireEvent.change(input, { target: { value: '45' } });
      fireEvent.click(submitButton);

      expect(onSearchMock).toHaveBeenCalledWith(45);
    });

    it('resets inputs to default value on reset click', () => {
      const onSearchMock = vi.fn();
      render(<LowRotationFilters onSearch={onSearchMock} isLoading={false} defaultDays={90} />);

      const input = screen.getByLabelText(/Periodo sin Venta/i);
      const resetButton = screen.getByRole('button', { name: /Restablecer/i });

      fireEvent.change(input, { target: { value: '120' } });
      fireEvent.click(resetButton);

      expect(input).toHaveValue(90);
      expect(onSearchMock).toHaveBeenCalledWith(90);
    });
  });

  describe('LowRotationTable Component', () => {
    it('renders analytical list items properly', () => {
      render(<LowRotationTable items={mockLowRotationData.data} />);

      expect(screen.getByText('CAM-001-M-BLA')).toBeInTheDocument();
      expect(screen.getByText('Camisa Casual')).toBeInTheDocument();
      expect(screen.getByText('105 días')).toBeInTheDocument();
      expect(screen.getByText('15 und.')).toBeInTheDocument();

      expect(screen.getByText('PNT-002-32-NE')).toBeInTheDocument();
      expect(screen.getByText('Pantalon Jean')).toBeInTheDocument();
      expect(screen.getByText('60 días')).toBeInTheDocument();
      expect(screen.getByText('4 und.')).toBeInTheDocument();
    });

    it('sorts rows when column headers are clicked', () => {
      render(<LowRotationTable items={mockLowRotationData.data} />);

      // By default sorted by daysWithoutMovement desc: var-1 (105 days), then var-2 (60 days)
      const rowsBefore = screen.getAllByRole('row');
      expect(rowsBefore[1]).toHaveTextContent('Camisa Casual');
      expect(rowsBefore[2]).toHaveTextContent('Pantalon Jean');

      // Click "Stock Actual" to sort by currentStock (will sort desc initially or asc/desc depending on code)
      const stockHeader = screen.getByText('Stock Actual');
      fireEvent.click(stockHeader);

      // Now sorted by currentStock desc: var-1 (15 und) then var-2 (4 und)
      const rowsAfterDesc = screen.getAllByRole('row');
      expect(rowsAfterDesc[1]).toHaveTextContent('Camisa Casual');
      expect(rowsAfterDesc[2]).toHaveTextContent('Pantalon Jean');

      // Click "Stock Actual" again to reverse (asc): var-2 (4 und) then var-1 (15 und)
      fireEvent.click(stockHeader);
      const rowsAfterAsc = screen.getAllByRole('row');
      expect(rowsAfterAsc[1]).toHaveTextContent('Pantalon Jean');
      expect(rowsAfterAsc[2]).toHaveTextContent('Camisa Casual');
    });
  });

  describe('LowRotationPage Integrations', () => {
    it('fetches report on mount and displays data in table', async () => {
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockLowRotationData });

      render(<LowRotationPage />);

      // Verify page fetches on mount with default 90 days
      expect(axiosInstance.get).toHaveBeenCalledWith('/v1/admin/reports/low-rotation', {
        params: { days: 90 },
      });

      await waitFor(() => {
        expect(screen.getByText('CAM-001-M-BLA')).toBeInTheDocument();
        expect(screen.getByText('PNT-002-32-NE')).toBeInTheDocument();
      });
    });

    it('triggers CSV download utility when export button is clicked', async () => {
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockLowRotationData });

      render(<LowRotationPage />);

      await waitFor(() => {
        expect(screen.getByText('CAM-001-M-BLA')).toBeInTheDocument();
      });

      const exportBtn = screen.getByRole('button', { name: /Exportar a CSV/i });
      fireEvent.click(exportBtn);

      expect(exportLowRotationToCSV).toHaveBeenCalledWith(mockLowRotationData.data, 90);
    });
  });
});
