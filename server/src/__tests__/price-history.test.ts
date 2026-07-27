import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  const mockPriceHistory = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  const mockProduct = {
    findUnique: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    priceHistory: mockPriceHistory,
    product: mockProduct,
    user: mockUser,
  };

  return { __esModule: true, default: mockPrisma };
});

// 2. Mock JwtService para simular sesiones
let mockUserSession = {
  userId: 1,
  email: 'user1@dmendoza.com',
  role: 'ADMIN',
};

jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockImplementation(() => mockUserSession),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('HU-014: Historial de Cambios de Precios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserSession = {
      userId: 1,
      email: 'user1@dmendoza.com',
      role: 'ADMIN',
    };
  });

  it('debe retornar el historial de cambios de precio del producto indicando usuario, fecha/hora y valores', async () => {
    // Simulamos que el usuario logueado existe y tiene permisos
    const mockAdmin = {
      id: 1,
      email: 'user1@dmendoza.com',
      isActive: true,
      roles: [
        {
          name: 'ADMIN',
          permissions: [
            { name: 'products:read' },
          ],
        },
      ],
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);

    // Simulamos que el producto existe
    const mockProduct = { id: 10, code: 'PROD10', name: 'Zapatillas Pro' };
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);

    // Simulamos los registros en PriceHistory que se generaron al cambiar el precio dos veces con dos usuarios distintos
    const mockHistoryRecords = [
      {
        id: 1,
        variantId: 15,
        userId: 1,
        priceType: 'SALE',
        oldPrice: '100.00',
        newPrice: '120.00',
        createdAt: new Date('2026-07-13T10:00:00Z'),
        user: {
          id: 1,
          name: 'Carlos Perez',
          email: 'user1@dmendoza.com',
        },
      },
      {
        id: 2,
        variantId: 15,
        userId: 2,
        priceType: 'SALE',
        oldPrice: '120.00',
        newPrice: '110.00',
        createdAt: new Date('2026-07-13T11:00:00Z'),
        user: {
          id: 2,
          name: 'Maria Gomez',
          email: 'user2@dmendoza.com',
        },
      },
    ];

    (prisma.priceHistory.findMany as any).mockResolvedValue(mockHistoryRecords);

    // Ejecutamos la consulta GET
    const response = await request(app)
      .get('/api/v1/products/10/price-history')
      .set('Authorization', 'Bearer token_valido');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);

    // Validamos el primer registro de cambio
    expect(response.body.data[0]).toEqual({
      id: 1,
      variantId: 15,
      userId: 1,
      priceType: 'SALE',
      oldPrice: 100,
      newPrice: 120,
      createdAt: '2026-07-13T10:00:00.000Z',
      user: {
        id: 1,
        name: 'Carlos Perez',
        email: 'user1@dmendoza.com',
      },
    });

    // Validamos el segundo registro de cambio (Usuario 2)
    expect(response.body.data[1]).toEqual({
      id: 2,
      variantId: 15,
      userId: 2,
      priceType: 'SALE',
      oldPrice: 120,
      newPrice: 110,
      createdAt: '2026-07-13T11:00:00.000Z',
      user: {
        id: 2,
        name: 'Maria Gomez',
        email: 'user2@dmendoza.com',
      },
    });

    expect(prisma.priceHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          variant: {
            productId: 10,
          },
        },
      })
    );
  });
});
