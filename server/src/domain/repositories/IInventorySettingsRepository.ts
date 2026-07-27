import type { ValuationMethod } from '@prisma/client';

export interface InventorySettingsData {
  id: number;
  valuationMethod: ValuationMethod;
  updatedAt: Date;
  updatedByUserId: number | null;
}

export interface IInventorySettingsRepository {
  get(): Promise<InventorySettingsData>;
  update(
    method: ValuationMethod,
    userId?: number
  ): Promise<InventorySettingsData>;
}
