import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { getNPSSurveyTemplate } from '@infrastructure/services/templates/NPSSurveyTemplate';
import crypto from 'crypto';

const emailService = new ResendEmailService();

export class NPSSurveyJob {
  public static start(): void {
    console.log('[Job] NPSSurveyJob inicializado (0 * * * *)');
    
    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('[Job] Ejecutando NPSSurveyJob...');
      try {
        await this.processNPS();
      } catch (error) {
        console.error('[Job Error] Fallo al procesar encuestas NPS:', error);
      }
    });
  }

  public static validateSurveyPayload(payload: { orderId?: number | null, posOrderId?: number | null }) {
    if (payload.orderId && payload.posOrderId) {
      throw new Error("Una encuesta NPS no puede estar asociada a una orden E-commerce y a una venta POS simultáneamente.");
    }
    if (!payload.orderId && !payload.posOrderId) {
      throw new Error("Una encuesta NPS debe estar asociada a una orden E-commerce o a una venta POS.");
    }
  }

  public static async processNPS(): Promise<void> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 1. E-COMMERCE
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        npsSurvey: null,
        statusLogs: {
          some: {
            status: 'DELIVERED',
            changedAt: { lte: twentyFourHoursAgo },
          },
        },
      },
      include: {
        user: true,
      },
    });

    for (const order of deliveredOrders) {
      if (!order.user.email) continue;

      try {
        const token = crypto.randomBytes(32).toString('hex');
        
        NPSSurveyJob.validateSurveyPayload({ orderId: order.id });

        await prisma.nPSSurvey.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            token,
            channel: 'ECOMMERCE'
          }
        });

        const surveyUrl = `${frontendUrl}/ecommerce/nps/${token}`;
        const htmlContent = getNPSSurveyTemplate(order.user.name || 'Cliente', surveyUrl, order.user.email);
        await emailService.sendEmail(order.user.email, "Tu opinión nos importa 🌟 - D'Mendoza", htmlContent);
        console.log(`[Job] Encuesta NPS ECOMMERCE enviada a ${order.user.email} (Orden: ${order.id})`);
      } catch (error) {
        console.error(`[Job Error] Fallo al procesar encuesta NPS ECOMMERCE para ${order.user.email}:`, error);
      }
    }

    // 2. POS
    const posOrders = await prisma.posOrder.findMany({
      where: {
        status: 'COMPLETED',
        npsSurvey: null,
        createdAt: { lte: twentyFourHoursAgo },
        clientId: { not: null },
      },
      include: {
        client: true,
      },
    });

    for (const posOrder of posOrders) {
      if (!posOrder.client?.email) continue;

      try {
        const token = crypto.randomBytes(32).toString('hex');
        
        NPSSurveyJob.validateSurveyPayload({ posOrderId: posOrder.id });

        await prisma.nPSSurvey.create({
          data: {
            posOrderId: posOrder.id,
            clientId: posOrder.clientId,
            token,
            channel: 'POS'
          }
        });

        const surveyUrl = `${frontendUrl}/ecommerce/nps/${token}`;
        const htmlContent = getNPSSurveyTemplate(posOrder.client.name || 'Cliente', surveyUrl, posOrder.client.email);
        await emailService.sendEmail(posOrder.client.email, "Tu opinión nos importa 🌟 - D'Mendoza (Tienda Física)", htmlContent);
        console.log(`[Job] Encuesta NPS POS enviada a ${posOrder.client.email} (PosOrder: ${posOrder.id})`);
      } catch (error) {
        console.error(`[Job Error] Fallo al procesar encuesta NPS POS para ${posOrder.client.email}:`, error);
      }
    }
  }
}
