import prisma from '@infrastructure/database/prisma';

interface CalculateCheckoutDTO {
  cartId: number;
  addressId: number;
}

export class CalculateCheckoutUseCase {
  async execute(data: CalculateCheckoutDTO) {
    const { cartId, addressId } = data;

    // 1. Obtener carrito y calcular subtotal
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      const itemPrice = Number(item.variant.price);
      const itemDiscount = item.variant.discountPercent || 0;
      
      const finalPrice = itemDiscount > 0 
        ? itemPrice - (itemPrice * itemDiscount) / 100 
        : itemPrice;
        
      subtotal += finalPrice * item.quantity;
    });

    // 2. Obtener dirección
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Dirección no encontrada');
    }

    // 3. Obtener zona de delivery según el distrito
    // En MySQL, los JSON se pueden consultar con JSON_CONTAINS, pero a través de Prisma
    // una forma simple es traer todas las zonas y buscar el distrito.
    const deliveryZones = await prisma.deliveryZone.findMany();
    let shippingCost = 0;
    let estimatedDays = 0;
    let hasCoverage = false;

    for (const zone of deliveryZones) {
      // districts es un Json Array: ["Miraflores", "San Isidro"]
      const districtsArray = zone.districts as string[];
      if (Array.isArray(districtsArray) && districtsArray.includes(address.district)) {
        shippingCost = Number(zone.deliveryCost);
        estimatedDays = zone.estimatedDays;
        hasCoverage = true;
        break;
      }
    }

    if (!hasCoverage) {
      throw new Error('Lo sentimos, tu distrito actual no cuenta con cobertura de envío.');
    }

    const total = subtotal + shippingCost;

    return {
      subtotal,
      shippingCost,
      estimatedDays,
      total,
      hasCoverage
    };
  }
}
