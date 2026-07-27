import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransferPage from '../TransferPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { adminTransferService } from '../services/adminTransferService';

vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../services/adminTransferService', () => ({
  adminTransferService: {
    downloadTransferGuide: vi.fn(),
  },
}));

const mockBranches = {
  success: true,
  data: [
    { id: 1, name: 'Sede Principal', isActive: true },
    { id: 2, name: 'Sede Miraflores', isActive: true },
  ],
};

const mockStockInfo = {
  success: true,
  data: [
    {
      variantId: 10,
      sku: 'CAM-M-ROJO',
      productName: 'Camisa Elegante Roja',
      globalStock: 100,
      byBranch: [
        { branchId: 1, branchName: 'Sede Principal', quantity: 20 },
        { branchId: 2, branchName: 'Sede Miraflores', quantity: 15 },
      ],
    },
  ],
};

const mockTransferSuccess = {
  success: true,
  data: {
    id: 123,
    fromBranchId: 1,
    toBranchId: 2,
    variantId: 10,
    quantity: 5,
  },
};

describe('TransferPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === '/v1/branches') {
        return Promise.resolve({ data: mockBranches });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  it('loads branches and shows selectors correctly', async () => {
    const { container } = render(<TransferPage />);

    await waitFor(() => {
      const options = container.querySelectorAll('option');
      const texts = Array.from(options).map(o => o.textContent);
      expect(texts).toContain('Sede Principal');
      expect(texts).toContain('Sede Miraflores');
    });
  });

  it('searches for variant by SKU and allows typing transfer quantity', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === '/v1/branches') {
        return Promise.resolve({ data: mockBranches });
      }
      if (url.includes('/v1/stock')) {
        return Promise.resolve({ data: mockStockInfo });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<TransferPage />);

    // Select source branch
    await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: '1' },
    });

    // Search by SKU
    const skuInput = screen.getByPlaceholderText(/Escanea o digita el SKU/i);
    fireEvent.change(skuInput, { target: { value: 'CAM-M-ROJO' } });

    const searchBtn = screen.getByRole('button', { name: /Buscar/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Camisa Elegante Roja')).toBeInTheDocument();
      expect(screen.getByText('20 unds.')).toBeInTheDocument();
    });

    // Check quantity input
    const qtyInput = screen.getByPlaceholderText(/Máx. 20/i);
    expect(qtyInput).toBeInTheDocument();
  });

  it('performs successful stock transfer and shows guide download banner', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === '/v1/branches') {
        return Promise.resolve({ data: mockBranches });
      }
      if (url.includes('/v1/stock')) {
        return Promise.resolve({ data: mockStockInfo });
      }
      return Promise.reject(new Error('Not Found'));
    });

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockTransferSuccess });

    render(<TransferPage />);

    // Configure source and destination branches
    await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument());
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], {
      target: { value: '1' },
    });
    fireEvent.change(comboboxes[1], {
      target: { value: '2' },
    });

    // Search SKU
    const skuInput = screen.getByPlaceholderText(/Escanea o digita el SKU/i);
    fireEvent.change(skuInput, { target: { value: 'CAM-M-ROJO' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar/i }));

    await waitFor(() => screen.getByPlaceholderText(/Máx. 20/i));

    // Input quantity
    const qtyInput = screen.getByPlaceholderText(/Máx. 20/i);
    fireEvent.change(qtyInput, { target: { value: '5' } });

    // Submit transfer
    const submitBtn = screen.getByRole('button', { name: /Ejecutar Transferencia/i });
    fireEvent.click(submitBtn);

    // Wait for success and verify banner
    await waitFor(() => {
      expect(screen.getByText('¡Transferencia Procesada Exitosamente!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Descargar Guía/i })).toBeInTheDocument();
    });

    // Test download guide button trigger
    const downloadBtn = screen.getByRole('button', { name: /Descargar Guía/i });
    fireEvent.click(downloadBtn);

    expect(adminTransferService.downloadTransferGuide).toHaveBeenCalledWith(123);
  });
});
