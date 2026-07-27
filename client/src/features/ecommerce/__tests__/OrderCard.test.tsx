import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { OrderCard } from '../components/OrderCard';
import type { Order } from '../types/order.types';
import { Toaster } from 'react-hot-toast';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const baseOrder: Order = {
  id: 10,
  status: 'DELIVERED',
  total: 150,
  shippingCost: 10,
  addressSnapshot: {
    alias: 'Casa',
    fullAddress: 'Av. Larco 123',
    district: 'Miraflores',
  },
  createdAt: '2026-07-01T10:00:00Z',
  items: [
    { id: 1, variantId: 5, qty: 2, unitPrice: 70, variantSku: 'SKU-A', productName: 'Camisa' },
  ],
};

const renderCard = (order: Order) =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <OrderCard order={order} />
        <Toaster />
      </MemoryRouter>
    </HelmetProvider>
  );

describe('OrderCard — Pickup Order Display', () => {
  it('does NOT show pickup section when there are no return requests', () => {
    renderCard(baseOrder);
    expect(screen.queryByText(/Orden de Recojo/)).not.toBeInTheDocument();
  });

  it('does NOT show pickup section when return is PENDING', () => {
    const order: Order = {
      ...baseOrder,
      returnRequests: [{ id: 1, status: 'PENDING', reason: 'Talla incorrecta' }],
    };
    renderCard(order);
    expect(screen.queryByText(/Orden de Recojo/)).not.toBeInTheDocument();
  });

  it('does NOT show pickup section when return is REJECTED', () => {
    const order: Order = {
      ...baseOrder,
      returnRequests: [{ id: 1, status: 'REJECTED', reason: 'No procede' }],
    };
    renderCard(order);
    expect(screen.queryByText(/Orden de Recojo/)).not.toBeInTheDocument();
  });

  it('shows pickup order section when return is APPROVED with pickupOrder', () => {
    const order: Order = {
      ...baseOrder,
      returnRequests: [
        {
          id: 1,
          status: 'APPROVED',
          reason: 'Talla incorrecta',
          pickupOrder: {
            id: 42,
            status: 'PENDING',
            type: 'PICKUP',
            createdAt: '2026-07-02T10:00:00Z',
            updatedAt: '2026-07-02T10:00:00Z',
          },
        },
      ],
    };
    renderCard(order);

    expect(screen.getByText('Orden de Recojo')).toBeInTheDocument();
    expect(screen.getByText('Recojo #42')).toBeInTheDocument();
    expect(screen.getByText('Recojo Pendiente')).toBeInTheDocument();
  });

  it('shows correct badge when pickup order is IN_TRANSIT', () => {
    const order: Order = {
      ...baseOrder,
      returnRequests: [
        {
          id: 1,
          status: 'APPROVED',
          reason: 'Talla incorrecta',
          pickupOrder: {
            id: 55,
            status: 'IN_TRANSIT',
            type: 'PICKUP',
            createdAt: '2026-07-02T10:00:00Z',
            updatedAt: '2026-07-03T08:00:00Z',
          },
        },
      ],
    };
    renderCard(order);

    expect(screen.getByText('En Camino a Recoger')).toBeInTheDocument();
  });

  it('shows correct badge when pickup order is DELIVERED (picked up)', () => {
    const order: Order = {
      ...baseOrder,
      returnRequests: [
        {
          id: 1,
          status: 'APPROVED',
          reason: 'Talla incorrecta',
          pickupOrder: {
            id: 55,
            status: 'DELIVERED',
            type: 'PICKUP',
            createdAt: '2026-07-02T10:00:00Z',
            updatedAt: '2026-07-03T12:00:00Z',
          },
        },
      ],
    };
    renderCard(order);

    expect(screen.getByText('Producto Recogido')).toBeInTheDocument();
  });
});
