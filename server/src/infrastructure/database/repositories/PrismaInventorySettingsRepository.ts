import type { ValuationMethod } from '@prisma/client';
import prisma from '@infrastructure/database/prisma';
import type { IInventorySettingsRepository, InventorySettingsData } from '@domain/repositories/IInventorySettingsRepository';

const SINGLETON_ID = 1;

export class PrismaInventorySettingsRepository implements IInventorySettingsRepository {
  async get(): Promise<InventorySettingsData> {
    const record = await prisma.inventorySettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, valuationMethod: 'PROMEDIO_PONDERADO' },
      update: {},
    });
    return record;
  }

  async update(method: ValuationMethod, userId?: number): Promise<InventorySettingsData> {
    const record = await prisma.inventorySettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, valuationMethod: method, updatedByUserId: userId ?? null },
      update: { valuationMethod: method, updatedByUserId: userId ?? null },
    });
    return record;
  }
}
