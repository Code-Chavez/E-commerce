import { Prisma } from '@prisma/client';
import prisma from '@infrastructure/database/prisma';

export class UpdateUserPreferencesUseCase {
  async execute(userId: number, preferencesJson: Record<string, any>): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferencesJson: preferencesJson as Prisma.InputJsonValue,
      },
    });
  }
}
