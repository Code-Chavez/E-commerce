import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { getBirthdayCouponTemplate } from '@infrastructure/services/templates/BirthdayCouponTemplate';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';

const emailService = new ResendEmailService();

export class BirthdayCouponJob {
  public static start(): void {
    console.log('[Job] BirthdayCouponJob inicializado (0 8 * * *)');
    
    // Ejecutar a las 8:00 AM todos los días (hora local del servidor)
    cron.schedule('0 8 * * *', async () => {
      console.log('[Job] Ejecutando BirthdayCouponJob...');
      try {
        await this.processBirthdays();
      } catch (error) {
        console.error('[Job Error] Fallo al procesar cumpleaños:', error);
      }
    });
  }

  public static async processBirthdays(): Promise<void> {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate(); // 1-31

    // Consultar usuarios que cumplen años hoy
    const birthdayUsers = await prisma.user.findMany({
      where: {
        birthdate: { not: null },
      },
    });

    const todayBirthdayUsers = birthdayUsers.filter(user => {
      if (!user.birthdate) return false;
      const bDate = new Date(user.birthdate);
      return (bDate.getUTCMonth() + 1 === currentMonth) && (bDate.getUTCDate() === currentDay);
    });

    if (todayBirthdayUsers.length === 0) {
      console.log('[Job] No se encontraron usuarios con cumpleaños el día de hoy.');
      return;
    }

    console.log(`[Job] Encontrados ${todayBirthdayUsers.length} usuarios de cumpleaños hoy.`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const user of todayBirthdayUsers) {
      if (!user.email) continue;

      try {
        // Verificar si ya se le generó un cupón de cumpleaños este año para evitar duplicados
        const currentYear = today.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        
        const existingCoupon = await prisma.coupon.findFirst({
          where: {
            userId: user.id,
            code: { startsWith: 'BDAY-' },
            createdAt: { gte: startOfYear },
          },
        });

        if (existingCoupon) {
          console.log(`[Job] El usuario ${user.email} ya recibió un cupón de cumpleaños este año.`);
          continue;
        }

        // Crear cupón único
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const couponCode = `BDAY-${user.id}-${randomString}`;
        
        const daysStr = await SystemSettingCacheService.getSetting('BIRTHDAY_COUPON_DAYS', '7');
        const days = parseInt(daysStr, 10);
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days); // Válido por los días configurados

        await prisma.coupon.create({
          data: {
            code: couponCode,
            type: 'PERCENT',
            value: 15.00,
            expiresAt,
            maxUses: 1,
            userId: user.id,
            isActive: true,
          },
        });

        // Enviar correo
        const htmlContent = getBirthdayCouponTemplate(
          user.name || 'Cliente',
          couponCode,
          frontendUrl,
          user.email
        );

        await emailService.sendEmail(
          user.email,
          "🎉 ¡Feliz Cumpleaños! Aquí tienes tu regalo de E-Commerce 🎁",
          htmlContent
        );

        console.log(`[Job] Cupón de cumpleaños enviado a ${user.email} (Cupón: ${couponCode})`);
      } catch (error) {
        console.error(`[Job Error] Fallo al procesar cumpleaños para ${user.email}:`, error);
      }
    }
  }
}
