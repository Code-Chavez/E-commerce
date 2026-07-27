import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import ResetPasswordPage from '../auth/ResetPasswordPage';
import { BrandProvider } from '@/shared/context/BrandContext';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('HU-003: Recuperación de contraseña olvidada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (initialRoute: string) => {
    return render(
      <BrandProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Toaster />
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      </BrandProvider>
    );
  };

  it('1. Solicitar y restablecer la contraseña (Flujo feliz)', async () => {
    // Paso 1: Solicitar contraseña
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders('/forgot-password');

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar enlace/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/forgot-password'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Enlace enviado!/i)).toBeInTheDocument();
    });

    // Paso 2: Restablecer contraseña
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders('/reset-password?token=valid_token');

    const newPasswordInput = screen.getByLabelText(/Nueva contraseña/i);
    fireEvent.change(newPasswordInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Establecer nueva contraseña/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/reset-password'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('2. Intentar usar el MISMO enlace por segunda vez (Token reutilizado)', async () => {
    const errorMsg = 'El token de recuperación no es válido o ya fue utilizado.';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: errorMsg }),
    });

    renderWithProviders('/reset-password?token=used_token');

    const newPasswordInput = screen.getByLabelText(/Nueva contraseña/i);
    fireEvent.change(newPasswordInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Establecer nueva contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  it('3. Intentar usar un enlace expirado (Expiración de 1 hora)', async () => {
    const errorMsg = 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: errorMsg }),
    });

    renderWithProviders('/reset-password?token=expired_token');

    const newPasswordInput = screen.getByLabelText(/Nueva contraseña/i);
    fireEvent.change(newPasswordInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Establecer nueva contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  it('4. Confirmar validaciones locales (Zod/Yup) para la nueva contraseña', async () => {
    renderWithProviders('/reset-password?token=some_token');

    const newPasswordInput = screen.getByLabelText(/Nueva contraseña/i);
    const submitButton = screen.getByRole('button', { name: /Establecer nueva contraseña/i });

    // Intento 1: Contraseña muy corta y sin mayúsculas/números
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Mínimo 8 caracteres/i)).toBeInTheDocument();
    });

    // Intento 2: Contraseña sin mayúsculas
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Debe contener al menos una letra mayúscula/i)).toBeInTheDocument();
    });

    // Intento 3: Contraseña sin números
    fireEvent.change(newPasswordInput, { target: { value: 'Password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Debe contener al menos un número/i)).toBeInTheDocument();
    });

    // Verifica que NO se llamó a fetch (validación bloqueada)
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
