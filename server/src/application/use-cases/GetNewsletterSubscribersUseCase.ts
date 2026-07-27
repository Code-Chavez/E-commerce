import { INewsletterRepository } from '../../domain/repositories/INewsletterRepository';
import { NewsletterSubscriber } from '../../domain/entities/NewsletterSubscriber';

export class GetNewsletterSubscribersUseCase {
  constructor(private newsletterRepository: INewsletterRepository) {}

  async execute(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: NewsletterSubscriber[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allActive = await this.newsletterRepository.findAllActive();
    const total = allActive.length;

    // In-memory pagination since repository returns all
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allActive.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      page,
      limit,
    };
  }
}
