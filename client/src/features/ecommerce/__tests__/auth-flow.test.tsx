import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import RegisterPage from '../auth/RegisterPage';
import VerifyPage from '../auth/VerifyPage';
import LoginPage from '../auth/LoginPage';
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

describe('HU-002: Registro manual y verificación de cuenta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (initialRoute: string) => {
    return render(
      <BrandProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Toaster />
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </BrandProvider>
    );
  };

  it('1. Registro de cuenta y transición UI correcta a la pantalla de verificación', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders('/register');

    // Fill form
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'Password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'Password123' })
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify?email=test%40example.com');
    });
  });

  it('2. Intento de login sin verificar (debe mostrar feedback visual de rechazo)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Por favor, verifica tu cuenta primero.' }),
    });

    renderWithProviders('/login');
    
    // Simulate login form submission
    // Assuming LoginPage has these fields based on standard implementations
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/Por favor, verifica tu cuenta primero/i)).toBeInTheDocument();
    });
  });

  it('3. Verificación exitosa (debe redirigir y permitir login de forma fluida)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders('/verify?email=test@example.com');

    // VerificationCode has 6 inputs, they don't have distinct labels easily targetable by label text
    // Assuming they are role="textbox"
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);

    // Simulate typing the pin 123456
    const code = '123456';
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: code[i] } });
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/verify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', pin: '123456' })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Cuenta verificada exitosamente!/i)).toBeInTheDocument();
    });
  });

  it('4. Simulación de error por PIN expirado tras 24 horas (Toast de error del backend)', async () => {
    const expiredMessage = 'El código de verificación ha expirado. Por favor, regístrese nuevamente.';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: expiredMessage }),
    });

    renderWithProviders('/verify?email=test@example.com');

    const inputs = screen.getAllByRole('textbox');
    
    // Paste logic works by filling inputs and calling onChange
    // The test logic from above works perfectly as well
    const code = '654321';
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: code[i] } });
    }

    await waitFor(() => {
      expect(screen.getByText(expiredMessage)).toBeInTheDocument();
    });
  });
});
