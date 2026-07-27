import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrandingPage } from './BrandingPage';

// Mock axiosInstance
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import axiosInstance from '@/shared/api/axiosInstance';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'react-hot-toast';

// Mock useBrand
vi.mock('@/shared/context/BrandContext', () => ({
  useBrand: vi.fn(() => ({
    refreshBrandConfig: vi.fn(),
  })),
}));

describe('BrandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and then displays form fields with loaded data', async () => {
    // Mock API response for fetch config
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          brandName: 'D Mendoza Test',
          logoHorizontalUrl: 'https://test.com/logo.png',
          colorBrandBg: '#F7F7F5',
          colorBrandPrimary: '#ff0000',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
          socialLinksJson: {
            facebook: 'https://fb.com/test',
            instagram: 'https://ig.com/test',
            twitter: '',
          },
        },
      },
    });

    render(<BrandingPage />);

    // Wait for the loader to disappear and component to render title and inputs
    await waitFor(() => {
      expect(screen.getByText('Identidad Visual')).toBeInTheDocument();
    });

    // Check that visual fields contain loaded values
    expect(screen.getByPlaceholderText("Ej. D'Mendoza")).toHaveValue('D Mendoza Test');
    
    // Check that the Logo Horizontal image is rendered
    expect(screen.getByAltText('Logo Horizontal')).toHaveAttribute('src', 'https://test.com/logo.png');
    
    // Check that social media links contain loaded values
    expect(screen.getByDisplayValue('https://fb.com/test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://ig.com/test')).toBeInTheDocument();
    // twitter is empty in mock, so its url input would be empty
  });

  it('submits correctly on clicking Guardar Cambios', async () => {
    (axiosInstance.get as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          brandName: 'D Mendoza Test',
          logoHorizontalUrl: 'https://test.com/logo.png',
          colorBrandBg: '#F7F7F5',
          colorBrandPrimary: '#ff0000',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
          socialLinksJson: {
            facebook: '',
            instagram: '',
            twitter: '',
          },
        },
      },
    });

    (axiosInstance.put as any).mockResolvedValue({
      data: { success: true },
    });

    render(<BrandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Identidad Visual')).toBeInTheDocument();
    });

    // Update Brand Name input field
    const brandInput = screen.getByPlaceholderText("Ej. D'Mendoza");
    fireEvent.change(brandInput, { target: { value: 'D\'Mendoza Global' } });

    // Click "Guardar Cambios" button
    const saveBtn = screen.getByText('Guardar Cambios');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Assert that API put request was called with correct updated body
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/v1/config/brand',
        expect.objectContaining({
          brandName: 'D\'Mendoza Global',
          logoHorizontalUrl: 'https://test.com/logo.png',
          colorBrandPrimary: '#ff0000',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
          socialLinksJson: {},
        })
      );
      
      // Assert that success toast was triggered
      expect(toast.success).toHaveBeenCalledWith('Configuración actualizada correctamente');
    });
  });
});
