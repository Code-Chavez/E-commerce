import prisma from '@infrastructure/database/prisma';
import { ITransactionManager } from '@domain/repositories/ITransactionManager';

export class PrismaTransactionManager implements ITransactionManager {
  async run<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(callback);
  }
}
