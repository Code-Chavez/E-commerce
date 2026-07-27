import { PrismaSystemSettingRepository } from '../database/repositories/PrismaSystemSettingRepository';

export class SystemSettingCacheService {
  private static cache: Map<string, { value: string; expiresAt: number }> =
    new Map();
  private static readonly TTL_MS = 5 * 60 * 1000; // 5 minutos
  private static repository = new PrismaSystemSettingRepository();

  public static async getSetting(
    key: string,
    defaultValue: string
  ): Promise<string> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const setting = await this.repository.getByKey(key);
      if (setting) {
        this.cache.set(key, {
          value: setting.value,
          expiresAt: Date.now() + this.TTL_MS,
        });
        return setting.value;
      }
    } catch (error) {
      console.error(
        `[SystemSettingCacheService] Error fetching setting ${key}:`,
        error
      );
    }

    // Fallback to default
    this.cache.set(key, {
      value: defaultValue,
      expiresAt: Date.now() + this.TTL_MS,
    });
    return defaultValue;
  }

  public static invalidate(key: string): void {
    this.cache.delete(key);
  }

  public static invalidateAll(): void {
    this.cache.clear();
  }
}
