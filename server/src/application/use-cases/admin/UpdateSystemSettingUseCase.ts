import { ISystemSettingRepository } from '@domain/repositories/ISystemSettingRepository';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';
import prisma from '@infrastructure/database/prisma';

export class UpdateSystemSettingUseCase {
  constructor(private settingRepository: ISystemSettingRepository) {}

  async execute(adminId: number, key: string, value: string) {
    // 1. Validar que el valor sea un número entero positivo para estas keys
    const validKeys = [
      'MIN_STOCK_ALERT',
      'PENDING_ORDER_TOLERANCE_HOURS',
      'ABANDONED_CART_HOURS',
      'BIRTHDAY_COUPON_DAYS'
    ];

    if (validKeys.includes(key)) {
      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue) || numericValue <= 0 || numericValue.toString() !== value.trim()) {
        const error = new Error(`El valor para ${key} debe ser un número entero positivo.`);
        (error as any).status = 400;
        throw error;
      }
    }

    // 2. Obtener el valor anterior para auditoría
    const oldSetting = await this.settingRepository.getByKey(key);
    const oldValue = oldSetting ? oldSetting.value : null;

    // 3. Actualizar la base de datos
    const updatedSetting = await this.settingRepository.update(key, value);

    // 4. Invalidar la caché inmediatamente
    SystemSettingCacheService.invalidate(key);

    // 5. Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_SYSTEM_SETTING',
        module: 'SETTINGS',
        details: { key, oldValue, newValue: value },
        userId: adminId,
      },
    });

    return updatedSetting;
  }
}
