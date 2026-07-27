import prisma from '@infrastructure/database/prisma';
import { ComplaintStatus } from '@prisma/client';

export class GetComplaintsAdminUseCase {
  async execute(status?: ComplaintStatus) {
    return prisma.complaint.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, name: true, lastName: true, email: true } },
        order: { select: { id: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
