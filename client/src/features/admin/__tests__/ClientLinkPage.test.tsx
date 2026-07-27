import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientLinkPage } from '../ClientLinkPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

// Mock axiosInstance
vi.mock('@/shared/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockClients = [
  { id: 1, name: 'Juan Perez', email: 'juan@test.com', documentId: '12345678', phone: '999888777' },
  { id: 2, name: 'Maria Gomez', email: 'maria@test.com', documentId: '87654321', phone: '999111222' },
];

describe('ClientLinkPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then lists clients', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({
      data: { data: mockClients },
    });

    render(<ClientLinkPage />);

    expect(screen.getByText('Cargando clientes...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cargando clientes...')).not.toBeInTheDocument();
  });

  it('filters clients list based on search term', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({
      data: { data: mockClients },
    });

    render(<ClientLinkPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email o DNI...');
    fireEvent.change(searchInput, { target: { value: 'Maria' } });

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
  });

  it('opens confirmation modal and links a single client successfully', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({
      data: { data: mockClients },
    });
    (axiosInstance.post as any).mockResolvedValueOnce({
      data: { success: true },
    });

    render(<ClientLinkPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Click "Vincular" button for Juan Perez
    const linkButtons = screen.getAllByText('Vincular');
    fireEvent.click(linkButtons[0]);

    // Modal should be open
    expect(screen.getByText('Vincular Cliente')).toBeInTheDocument();
    expect(
      screen.getByText('¿Estás seguro de vincular a Juan Perez y enviar sus credenciales de acceso por correo electrónico?')
    ).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/v1/admin/clients/1/link');
      expect(toast.success).toHaveBeenCalledWith('Cliente vinculado exitosamente');
    });
  });

  it('opens confirmation modal and bulk links selected clients successfully', async () => {
    (axiosInstance.get as any).mockResolvedValue({
      data: { data: mockClients },
    });
    (axiosInstance.post as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: { linked: 2, skipped: 0, errors: [] },
      },
    });

    render(<ClientLinkPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Select all clients
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "Select All"
    fireEvent.click(checkboxes[0]);

    // Click bulk action button
    const bulkButton = screen.getByRole('button', { name: /Vincular Seleccionados/ });
    fireEvent.click(bulkButton);

    // Modal should be open
    expect(screen.getByText('Vinculación Masiva')).toBeInTheDocument();
    expect(
      screen.getByText('¿Estás seguro de vincular a los 2 clientes seleccionados y enviar sus credenciales de acceso?')
    ).toBeInTheDocument();

    // Confirm bulk action
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/v1/admin/clients/bulk-link', { ids: [1, 2] });
      expect(toast.success).toHaveBeenCalledWith(
        'Vinculación masiva completada: 2 vinculados, 0 omitidos'
      );
    });
  });

  it('displays empty state when no unlinked clients exist', async () => {
    (axiosInstance.get as any).mockResolvedValueOnce({
      data: { data: [] },
    });

    render(<ClientLinkPage />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron clientes sin cuenta activa.')).toBeInTheDocument();
    });
  });
});
