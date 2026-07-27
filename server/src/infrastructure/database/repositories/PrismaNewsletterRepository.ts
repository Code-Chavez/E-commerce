import { prisma } from '../prisma';
import { INewsletterRepository } from '../../../domain/repositories/INewsletterRepository';
import { NewsletterSubscriber } from '../../../domain/entities/NewsletterSubscriber';

export class PrismaNewsletterRepository implements INewsletterRepository {
  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    return prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
  }

  async save(email: string): Promise<NewsletterSubscriber> {
    return prisma.newsletterSubscriber.create({
      data: {
        email,
        isActive: true,
      },
    });
  }

  async updateStatus(
    email: string,
    isActive: boolean
  ): Promise<NewsletterSubscriber> {
    return prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive },
    });
  }

  async findAllActive(): Promise<NewsletterSubscriber[]> {
    return prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
    });
  }
}
