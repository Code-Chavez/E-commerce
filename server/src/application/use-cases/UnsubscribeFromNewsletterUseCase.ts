import { INewsletterRepository } from '../../domain/repositories/INewsletterRepository';
import { NewsletterSubscriber } from '../../domain/entities/NewsletterSubscriber';

export class UnsubscribeFromNewsletterUseCase {
  constructor(private newsletterRepository: INewsletterRepository) {}

  async execute(email: string): Promise<NewsletterSubscriber> {
    const existing = await this.newsletterRepository.findByEmail(email);

    if (!existing) {
      throw new Error('Subscriber not found');
    }

    if (existing.isActive) {
      return this.newsletterRepository.updateStatus(email, false);
    }

    return existing;
  }
}
