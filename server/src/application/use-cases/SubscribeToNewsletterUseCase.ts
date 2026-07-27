import { INewsletterRepository } from "../../domain/repositories/INewsletterRepository";
import { NewsletterSubscriber } from "../../domain/entities/NewsletterSubscriber";

export class SubscribeToNewsletterUseCase {
  constructor(private newsletterRepository: INewsletterRepository) {}

  async execute(email: string): Promise<NewsletterSubscriber> {
    const existing = await this.newsletterRepository.findByEmail(email);

    if (existing) {
      if (!existing.isActive) {
        return this.newsletterRepository.updateStatus(email, true);
      }
      return existing;
    }

    return this.newsletterRepository.save(email);
  }
}
