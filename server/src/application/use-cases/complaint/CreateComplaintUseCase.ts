import prisma from '@infrastructure/database/prisma';
import { ComplaintCategory } from '@prisma/client';

export interface CreateComplaintInput {
  userId: number;
  orderId?: number;
  category: ComplaintCategory;
  description: string;
}

export class CreateComplaintUseCase {
  async execute(input: CreateComplaintInput) {
    return prisma.complaint.create({
      data: {
        userId: input.userId,
        orderId: input.orderId ?? null,
        category: input.category,
        description: input.description,
      },
      include: {
        order: { select: { id: true } },
      },
    });
  }
}
