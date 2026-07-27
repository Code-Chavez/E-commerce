import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KardexPage } from '../../kardex/KardexPage';
import axiosInstance from '@/shared/api/axiosInstance';
import { useAuth } from '@/shared/context/AuthContext';
import { toast } from 'react-hot-toast';

// Mocking dependencies
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/shared/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('../../entries/hooks/useStockEntries', () => ({
  useStockEntries: () => ({
    searchVariants: vi.fn().mockResolvedValue([
      { id: 1, sku: 'SKU123', productName: 'Producto Test', price: 100 }
    ]),
    searchingVariants: false,
  }),
}));

// Mock del subcomponente VariantAutocomplete para simplificar las pruebas
vi.mock('../../entries/components/VariantAutocomplete', () => ({
  VariantAutocomplete: ({ onSelect }: any) => (
    <button 
      onClick={() => onSelect({ id: 1, sku: 'SKU123', productName: 'Producto Test', price: 100 })}
      data-testid="mock-autocomplete"
    >
      Select Variant
    </button>
  ),
}));

describe('KardexPage (HU-026 Integration Tests)', () => {
  const mockBranches = [
    { id: 1, name: 'Sede San Isidro', isActive: true },
    { id: 2, name: 'Sede Miraflores', isActive: true }
  ];

  const mockKardexEntries = [
    {
      id: 1,
      type: 'COMPRA',
      quantity: 10,
      unitCost: 50.00,
      balanceQty: 10,
      balanceCost: 500.00,
      sku: 'SKU123',
      branch: 'Sede San Isidro',
      userName: 'Luis Cajero',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'VENTA',
      quantity: -2,
      unitCost: 50.00,
      balanceQty: 8,
      balanceCost: 400.00,
      sku: 'SKU123',
      branch: 'Sede San Isidro',
      userName: null,
      createdAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default GET mocks
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/v1/branches')) {
        return Promise.resolve({ data: { success: true, data: mockBranches } });
      }
      if (url.includes('/v1/admin/inventory-settings')) {
        return Promise.resolve({ data: { success: true, data: { valuationMethod: 'PROMEDIO_PONDERADO' } } });
      }
      if (url.includes('/v1/kardex')) {
        return Promise.resolve({ data: { success: true, data: mockKardexEntries } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  // Test 1: Muestra estado vacío si no se seleccionó variante ni sucursal
  it('should render initial state prompting variant and branch selection', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<KardexPage />);
    
    expect(screen.getByText('Selecciona un Producto y una Sucursal')).toBeInTheDocument();
    expect(screen.queryByText('Luis Cajero')).not.toBeInTheDocument();
  });

  // Test 2: Llama a GET /v1/kardex con los query params correctos al filtrar
  it('should fetch kardex movements when variant and branch are selected', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<KardexPage />);

    // Esperar a que carguen las sucursales
    await waitFor(() => {
      expect(screen.getByText('Sede San Isidro')).toBeInTheDocument();
    });

    // Seleccionar variante (usando el mock autocomplete)
    fireEvent.click(screen.getByTestId('mock-autocomplete'));

    // Seleccionar sucursal
    fireEvent.change(screen.getByLabelText('Sucursal'), { target: { value: '1' } });

    // Verificar que se realiza la consulta al Kardex con los parámetros esperados
    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/kardex?variantId=1&branchId=1')
      );
    });

    // Confirmar que los registros cargan en la tabla
    expect(screen.getByText('Luis Cajero')).toBeInTheDocument();
  });

  // Test 4: La tabla NO renderiza botones de edición ni eliminación
  it('should never render edit or delete buttons on the table', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<KardexPage />);

    await waitFor(() => {
      expect(screen.getByText('Sede San Isidro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-autocomplete'));
    fireEvent.change(screen.getByLabelText('Sucursal'), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Luis Cajero')).toBeInTheDocument();
    });

    // No debe haber ningún botón o link que contenga "editar" o "eliminar"
    const editBtn = screen.queryByRole('button', { name: /editar|eliminar|anular/i });
    expect(editBtn).toBeNull();
  });

  // Test 5: Renderiza las 7 columnas correctas incluyendo Usuario Responsable
  it('should render the correct 7 table headers', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<KardexPage />);

    await waitFor(() => {
      expect(screen.getByText('Sede San Isidro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-autocomplete'));
    fireEvent.change(screen.getByLabelText('Sucursal'), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Luis Cajero')).toBeInTheDocument();
    });

    expect(screen.getByText('Fecha/Hora')).toBeInTheDocument();
    expect(screen.getByText('Usuario Responsable')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Movimiento')).toBeInTheDocument();
    expect(screen.getByText('Cantidad')).toBeInTheDocument();
    expect(screen.getByText('Costo Unitario')).toBeInTheDocument();
    expect(screen.getByText('Saldo Cantidad')).toBeInTheDocument();
    expect(screen.getByText('Saldo Costo')).toBeInTheDocument();
  });

  // Test 6: Muestra — en la columna "Usuario Responsable" cuando userName es null
  it('should show placeholder dash for null users', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<KardexPage />);

    await waitFor(() => {
      expect(screen.getByText('Sede San Isidro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-autocomplete'));
    fireEvent.change(screen.getByLabelText('Sucursal'), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Luis Cajero')).toBeInTheDocument();
    });

    // En los mockEntries, el segundo elemento tiene userName: null. Debe renderizar "—"
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // Test 7: InventorySettingsModal llama a PUT /v1/admin/inventory-settings con el método correcto
  it('should trigger PUT settings request when updated via settings modal', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'ADMIN' } });
    (axiosInstance.put as any).mockResolvedValue({ data: { success: true, data: { valuationMethod: 'PEPS' } } });
    render(<KardexPage />);

    // Abrir modal
    const configBtn = screen.getByRole('button', { name: /método de valorización/i });
    fireEvent.click(configBtn);

    // Esperar a que se abra el modal y cargue el radio button de PEPS
    const pepsRadio = await screen.findByLabelText(/PEPS/);
    fireEvent.click(pepsRadio);

    // Guardar
    const saveBtn = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/v1/admin/inventory-settings',
        { valuationMethod: 'PEPS' }
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Método de valorización actualizado con éxito');
  });

  // Test 8: El botón/modal de configuración NO se renderiza para SUPPLY
  it('should not display settings config button for non-admin user roles', async () => {
    (useAuth as any).mockReturnValue({ user: { role: 'SUPPLY' } });
    render(<KardexPage />);

    const configBtn = screen.queryByRole('button', { name: /método de valorización/i });
    expect(configBtn).toBeNull();
  });
});
