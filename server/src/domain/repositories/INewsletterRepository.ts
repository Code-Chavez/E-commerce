import { NewsletterSubscriber } from '../entities/NewsletterSubscriber';

export interface INewsletterRepository {
  findByEmail(email: string): Promise<NewsletterSubscriber | null>;
  save(email: string): Promise<NewsletterSubscriber>;
  updateStatus(email: string, isActive: boolean): Promise<NewsletterSubscriber>;
  findAllActive(): Promise<NewsletterSubscriber[]>;
}
