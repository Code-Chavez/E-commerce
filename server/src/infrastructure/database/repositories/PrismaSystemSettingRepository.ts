import { prisma } from '../prisma';
import { ISystemSettingRepository } from '../../../domain/repositories/ISystemSettingRepository';
import { SystemSetting } from '../../../domain/entities/SystemSetting';

export class PrismaSystemSettingRepository implements ISystemSettingRepository {
  async getAll(): Promise<SystemSetting[]> {
    return prisma.systemSetting.findMany();
  }

  async getByKey(key: string): Promise<SystemSetting | null> {
    return prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  async update(key: string, value: string): Promise<SystemSetting> {
    return prisma.systemSetting.update({
      where: { key },
      data: { value },
    });
  }
}
