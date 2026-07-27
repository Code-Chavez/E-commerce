import prisma from '@infrastructure/database/prisma';
import { ComplaintStatus } from '@prisma/client';

export class UpdateComplaintStatusUseCase {
  async execute(id: number, status: ComplaintStatus) {
    return prisma.complaint.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
