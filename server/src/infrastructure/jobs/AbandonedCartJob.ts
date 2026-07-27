import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { getAbandonedCartEmailTemplate } from '@infrastructure/services/templates/AbandonedCartTemplate';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';

const emailService = new ResendEmailService();
const systemSettingService = new SystemSettingCacheService();

export class AbandonedCartJob {
  public static start(): void {
    console.log('[Job] AbandonedCartJob inicializado (0 * * * *)');
    
    // Ejecutar en el minuto 0 de cada hora (cada hora)
    cron.schedule('0 * * * *', async () => {
      console.log('[Job] Ejecutando AbandonedCartJob...');
      try {
        await this.processAbandonedCarts();
      } catch (error) {
        console.error('[Job Error] Fallo al procesar carritos abandonados:', error);
      }
    });
  }

  public static async processAbandonedCarts(): Promise<void> {
    const hoursStr = await SystemSettingCacheService.getSetting('ABANDONED_CART_HOURS', '24');
    const hours = parseInt(hoursStr, 10);
    const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const abandonedCarts = await prisma.cart.findMany({
      where: {
        userId: { not: null },
        abandonedEmailSent: false,
        updatedAt: { lte: thresholdDate },
        items: { some: {} }, // Al menos un item
      },
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (abandonedCarts.length === 0) {
      console.log('[Job] No se encontraron carritos abandonados pendientes.');
      return;
    }

    console.log(`[Job] Encontrados ${abandonedCarts.length} carritos abandonados.`);

    for (const cart of abandonedCarts) {
      if (!cart.user || !cart.user.email) continue;

      const itemsForTemplate = cart.items.map((item) => {
        const product = item.variant.product;
        const mainImage = product.images.find((img) => img.isMain)?.url || product.images[0]?.url;
        
        return {
          productName: product.name,
          variantName: item.variant.sku, // Usamos el sku o atributos si los tuviéramos
          quantity: item.quantity,
          price: Number(item.variant.price),
          imageUrl: mainImage,
        };
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const checkoutUrl = `${frontendUrl}/cart`;

      const htmlContent = getAbandonedCartEmailTemplate(
        cart.user.name || 'Cliente',
        itemsForTemplate,
        checkoutUrl,
        cart.user.email
      );

      try {
        await emailService.sendEmail(
          cart.user.email,
          "🛒 ¡No olvides tus productos en E-Commerce!",
          htmlContent
        );

        // Marcar como enviado si el envío es exitoso
        await prisma.cart.update({
          where: { id: cart.id },
          data: { abandonedEmailSent: true },
        });

        console.log(`[Job] Correo enviado a ${cart.user.email} (Cart ID: ${cart.id})`);
      } catch (error) {
        console.error(`[Job Error] Fallo al enviar correo a ${cart.user.email}:`, error);
      }
    }
  }
}
