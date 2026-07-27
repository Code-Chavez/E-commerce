import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuppliersTable } from '../suppliers/components/SuppliersTable';
import { SupplierModal } from '../suppliers/components/SupplierModal';

describe('HU-051: Gestión de proveedores (RF-82 Rubro)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar la columna Rubro en la tabla de proveedores', () => {
    const mockSuppliers = [
      {
        id: 1,
        ruc: '20123456789',
        razonSocial: 'Proveedor A',
        rubro: 'Tecnología',
        contacto: 'Juan Pérez',
        direccion: 'Calle Falsa 123',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      }
    ];

    render(
      <SuppliersTable
        suppliers={mockSuppliers}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />
    );

    // Verifica que existe el encabezado "Rubro"
    expect(screen.getByText('Rubro')).toBeInTheDocument();
    
    // Verifica que se muestra el rubro del proveedor mockeado
    expect(screen.getByText('Tecnología')).toBeInTheDocument();
  });

  it('2. Debe incluir rubro en el formulario Modal y enviarlo al hacer submit', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(true);
    
    render(
      <SupplierModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={mockOnSubmit}
        editingSupplier={null}
        submitting={false}
      />
    );

    // Completar formulario
    fireEvent.change(screen.getByLabelText(/RUC/i), { target: { value: '20123456789' } });
    fireEvent.change(screen.getByLabelText(/Razón Social/i), { target: { value: 'Proveedor Nuevo' } });
    fireEvent.change(screen.getByLabelText(/Rubro/i), { target: { value: 'Servicios' } });
    fireEvent.change(screen.getByLabelText(/Nombre de Contacto/i), { target: { value: 'Maria Lopez' } });
    
    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /Registrar/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ruc: '20123456789',
          razonSocial: 'Proveedor Nuevo',
          rubro: 'Servicios',
          contacto: 'Maria Lopez'
        }),
        expect.anything()
      );
    });
  });

  it('3. Debe cargar el rubro existente al editar', () => {
    const mockSupplier = {
      id: 2,
      ruc: '10987654321',
      razonSocial: 'Proveedor B',
      rubro: 'Construcción',
      contacto: 'Pedro Pascal',
      direccion: '',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    };

    render(
      <SupplierModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        editingSupplier={mockSupplier}
        submitting={false}
      />
    );

    // Verificar que el input tiene el valor cargado
    const rubroInput = screen.getByLabelText(/Rubro/i) as HTMLInputElement;
    expect(rubroInput.value).toBe('Construcción');
  });
});
