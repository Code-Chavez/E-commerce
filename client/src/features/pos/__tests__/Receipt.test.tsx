import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Receipt, ReceiptData } from '../components/Receipt';

const mockReceiptData: ReceiptData = {
  orderId: 100,
  date: new Date().toISOString(),
  seller: 'Admin',
  branch: { name: 'Main Branch', address: '123 Main St', phone: '123456789' },
  items: [],
  payments: [{ method: 'CASH', amount: 100 }],
  totals: { subtotal: 100, discountTotal: 0, total: 100 },
};

vi.mock('@/shared/context/BrandContext', () => ({
  useBrand: () => ({
    theme: { colors: { accent: '#000' } },
    brand: { name: 'E-Commerce' }
  }),
}));

describe('Receipt (HU-036 Audit Fix)', () => {
  beforeEach(() => {
    // Mock window.print
    window.print = vi.fn();
  });

  it('should render PARA RECOJO EN TIENDA when isPickup is true and not cross-branch', () => {
    const data = { ...mockReceiptData, isPickup: true };
    render(<Receipt data={data} />);
    
    expect(screen.getByText(/PARA RECOJO EN TIENDA/)).toBeInTheDocument();
    expect(screen.queryByText(/PENDIENTE DE RECOJO EN/)).not.toBeInTheDocument();
  });

  it('should render PENDIENTE DE RECOJO EN legend for cross-branch sales', () => {
    const data = { 
      ...mockReceiptData, 
      isCrossBranch: true, 
      sourceBranchName: 'San Isidro' 
    };
    render(<Receipt data={data} />);
    
    expect(screen.getByText('PENDIENTE DE RECOJO EN: SAN ISIDRO')).toBeInTheDocument();
    expect(screen.queryByText(/PARA RECOJO EN TIENDA/)).not.toBeInTheDocument();
  });
});
