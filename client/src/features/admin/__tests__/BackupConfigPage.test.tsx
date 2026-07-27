import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BackupConfigPage from '../BackupConfigPage';
import { backupConfigService } from '../services/backupConfig.service';
import { toast } from 'react-hot-toast';

vi.mock('../services/backupConfig.service', () => ({
  backupConfigService: {
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockConfig = {
  id: 1,
  retentionDays: 7,
  adminEmail: 'admin@dmendoza.com',
  cronExpression: '0 0 * * *',
  updatedAt: '2026-07-13T00:00:00.000Z',
};

describe('BackupConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    vi.mocked(backupConfigService.getConfig).mockReturnValue(new Promise(() => {}));
    render(<BackupConfigPage />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('loads and displays current config', async () => {
    vi.mocked(backupConfigService.getConfig).mockResolvedValue(mockConfig);
    render(<BackupConfigPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Retención de respaldos/i)).toHaveValue(7);
      expect(screen.getByLabelText(/Email de alerta/i)).toHaveValue('admin@dmendoza.com');
    });
  });

  it('shows validation error if retentionDays is 0', async () => {
    vi.mocked(backupConfigService.getConfig).mockResolvedValue(mockConfig);
    const { container } = render(<BackupConfigPage />);

    await waitFor(() => expect(screen.getByLabelText(/Retención de respaldos/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Retención de respaldos/i), { target: { value: '0' } });
    // Use fireEvent.submit to bypass native HTML5 constraint validation in jsdom
    fireEvent.submit(container.querySelector('form')!);

    expect(toast.error).toHaveBeenCalledWith('La retención debe ser un número mayor a 0');
    expect(backupConfigService.updateConfig).not.toHaveBeenCalled();
  });

  it('saves config successfully and shows success toast', async () => {
    vi.mocked(backupConfigService.getConfig).mockResolvedValue(mockConfig);
    const updatedConfig = { ...mockConfig, retentionDays: 14 };
    vi.mocked(backupConfigService.updateConfig).mockResolvedValue(updatedConfig);

    render(<BackupConfigPage />);

    await waitFor(() => expect(screen.getByLabelText(/Retención de respaldos/i)).toHaveValue(7));

    fireEvent.change(screen.getByLabelText(/Retención de respaldos/i), { target: { value: '14' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Configuración/i }));

    await waitFor(() => {
      expect(backupConfigService.updateConfig).toHaveBeenCalledWith({
        retentionDays: 14,
        adminEmail: 'admin@dmendoza.com',
        cronExpression: '0 0 * * *',
      });
      expect(toast.success).toHaveBeenCalledWith('Configuración de backup guardada');
    });
  });

  it('shows error toast if save fails', async () => {
    vi.mocked(backupConfigService.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(backupConfigService.updateConfig).mockRejectedValue({
      response: { data: { error: 'Error del servidor' } },
    });

    render(<BackupConfigPage />);

    await waitFor(() => expect(screen.getByLabelText(/Retención de respaldos/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Guardar Configuración/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error del servidor');
    });
  });
});
