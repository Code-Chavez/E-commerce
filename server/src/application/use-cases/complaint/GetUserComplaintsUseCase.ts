import prisma from '@infrastructure/database/prisma';

export class GetUserComplaintsUseCase {
  async execute(userId: number) {
    return prisma.complaint.findMany({
      where: { userId },
      include: {
        order: { select: { id: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
