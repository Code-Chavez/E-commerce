import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from '@infrastructure/database/prisma';
import { ApproveReturnRequestUseCase } from '@application/use-cases/returns/ApproveReturnRequestUseCase';
import { PrismaReturnRequestRepository } from '@infrastructure/database/repositories/PrismaReturnRequestRepository';
import { PrismaDeliveryRepository } from '@infrastructure/database/repositories/PrismaDeliveryRepository';

describe('Returns Logistical Integration (HU-065)', () => {
  let approveUseCase: ApproveReturnRequestUseCase;
  let returnRequestRepo: PrismaReturnRequestRepository;
  let deliveryRepo: PrismaDeliveryRepository;

  beforeAll(async () => {
    returnRequestRepo = new PrismaReturnRequestRepository();
    deliveryRepo = new PrismaDeliveryRepository();
    approveUseCase = new ApproveReturnRequestUseCase(
      returnRequestRepo,
      deliveryRepo
    );

    // Limpiar tablas del flujo del test
    await prisma.delivery.deleteMany();
    await prisma.returnRequestItem.deleteMany();
    await prisma.returnRequest.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should approve return request and generate PICKUP delivery successfully (Happy Path)', async () => {
    const timestamp = Date.now() + Math.random().toString(36).substring(2, 7);

    // 1. Crear dependencias con nombres únicos
    const user = await prisma.user.create({
      data: {
        email: `client.test.${timestamp}@returns.com`,
        password: 'password',
        name: 'Juan',
        lastName: 'Perez',
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Producto Retorno ${timestamp}`,
        description: 'Desc',
        slug: `producto-retorno-${timestamp}`,
        code: `PR-${timestamp}`,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-RET-${timestamp}`,
        price: 99.99,
        minStock: 2,
        isActive: true,
      },
    });

    // 2. Crear una orden entregada
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'DELIVERED',
        total: 99.99,
        shippingCost: 0,
        addressSnapshot: {
          address: 'Dirección de envío',
          district: 'Miraflores',
        },
        paymentIntentId: `pi_test_returns_happy_${timestamp}`,
        items: {
          create: {
            variantId: variant.id,
            qty: 2,
            unitPrice: 99.99,
          },
        },
      },
      include: {
        items: true,
      },
    });

    const orderItemId = order.items[0].id;

    // 3. Crear solicitud de devolución pendiente
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: user.id,
        reason: 'Defecto de fábrica en costura',
        refundType: 'STORE_CREDIT',
        status: 'PENDING',
        items: {
          create: {
            orderItemId: orderItemId,
            qty: 1,
          },
        },
      },
    });

    // 4. Ejecutar el caso de uso de aprobación
    const result = await approveUseCase.execute(returnRequest.id);

    expect(result.status).toBe('APPROVED');
    expect(result.pickupOrderId).toBeDefined();
    expect(result.pickupOrderId).not.toBeNull();

    const pickupOrderId = result.pickupOrderId as number;

    // 5. Verificar que se creó el registro del recojo físico (PICKUP) en la base de datos
    const dbDelivery = await prisma.delivery.findUnique({
      where: { id: pickupOrderId },
      include: {
        pickingItems: true,
      },
    });

    expect(dbDelivery).not.toBeNull();
    expect(dbDelivery?.type).toBe('PICKUP');
    expect(dbDelivery?.status).toBe('PENDING');
    expect(dbDelivery?.returnRequestId).toBe(returnRequest.id);

    const pickingItems = (dbDelivery as any)?.pickingItems;
    expect(pickingItems).toHaveLength(1);
    expect(pickingItems[0].variantId).toBe(variant.id);
    expect(pickingItems[0].qty).toBe(1);
  });

  it('should rollback transaction and not approve return request if delivery generation fails', async () => {
    const timestamp = Date.now() + Math.random().toString(36).substring(2, 7);

    // 1. Crear dependencias con nombres únicos
    const user = await prisma.user.create({
      data: {
        email: `client.rollback.${timestamp}@returns.com`,
        password: 'password',
        name: 'Pedro',
        lastName: 'Gomez',
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Producto Rollback ${timestamp}`,
        description: 'Desc',
        slug: `producto-rollback-${timestamp}`,
        code: `PR-ROL-${timestamp}`,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-ROL-${timestamp}`,
        price: 50.0,
        minStock: 2,
        isActive: true,
      },
    });

    // 2. Crear una orden entregada
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'DELIVERED',
        total: 50.0,
        shippingCost: 0,
        addressSnapshot: {
          address: 'Dirección Rollback',
          district: 'San Isidro',
        },
        paymentIntentId: `pi_test_returns_rollback_${timestamp}`,
        items: {
          create: {
            variantId: variant.id,
            qty: 1,
            unitPrice: 50.0,
          },
        },
      },
      include: {
        items: true,
      },
    });

    const orderItemId = order.items[0].id;

    // 3. Crear solicitud de devolución pendiente
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: user.id,
        reason: 'No me gustó el color',
        refundType: 'STORE_CREDIT',
        status: 'PENDING',
        items: {
          create: {
            orderItemId: orderItemId,
            qty: 1,
          },
        },
      },
    });

    // 4. Provocamos que la creación del delivery falle mockeando temporalmente createPickupOrder en el repo
    const originalCreatePickupOrder = deliveryRepo.createPickupOrder;
    deliveryRepo.createPickupOrder = jest.fn().mockImplementation(() => {
      throw new Error(
        'Error simulado en la creación del Delivery para Rollback'
      );
    }) as any;

    // 5. Intentamos ejecutar y esperamos la excepción
    await expect(approveUseCase.execute(returnRequest.id)).rejects.toThrow(
      'Error simulado en la creación del Delivery para Rollback'
    );

    // 6. Restaurar el método original
    deliveryRepo.createPickupOrder = originalCreatePickupOrder;

    // 7. Verificar que el status de la solicitud de devolución sigue en PENDING en la BD (se hizo rollback completo)
    const freshReturnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequest.id },
    });

    expect(freshReturnRequest?.status).toBe('PENDING');

    // 8. Verificar que no se insertó ninguna Delivery de tipo PICKUP asociada a la devolución
    const dbDeliveries = await prisma.delivery.findMany({
      where: { returnRequestId: returnRequest.id },
    });

    expect(dbDeliveries).toHaveLength(0);
  });
});
