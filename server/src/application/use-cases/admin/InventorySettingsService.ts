import type { ValuationMethod } from '@prisma/client';
import type {
  IInventorySettingsRepository,
  InventorySettingsData,
} from '@domain/repositories/IInventorySettingsRepository';
import { PrismaInventorySettingsRepository } from '@infrastructure/database/repositories/PrismaInventorySettingsRepository';

export class InventorySettingsService {
  private readonly repo: IInventorySettingsRepository;

  constructor(repo?: IInventorySettingsRepository) {
    this.repo = repo ?? new PrismaInventorySettingsRepository();
  }

  async getSettings(): Promise<InventorySettingsData> {
    return this.repo.get();
  }

  async updateMethod(
    method: ValuationMethod,
    userId?: number
  ): Promise<InventorySettingsData> {
    if (method !== 'PEPS' && method !== 'PROMEDIO_PONDERADO') {
      throw new Error(`Método de valorización inválido: ${method}`);
    }
    return this.repo.update(method, userId);
  }
}
