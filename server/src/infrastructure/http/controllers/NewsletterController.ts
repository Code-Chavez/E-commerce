import { Request, Response, NextFunction } from 'express';
import { PrismaNewsletterRepository } from '@infrastructure/database/repositories/PrismaNewsletterRepository';
import { SubscribeToNewsletterUseCase } from '@application/use-cases/SubscribeToNewsletterUseCase';
import { UnsubscribeFromNewsletterUseCase } from '@application/use-cases/UnsubscribeFromNewsletterUseCase';
import {
  SubscribeNewsletterSchema,
  UnsubscribeNewsletterSchema,
} from '@application/dtos/NewsletterDTOs';

const repository = new PrismaNewsletterRepository();
const subscribeUseCase = new SubscribeToNewsletterUseCase(repository);
const unsubscribeUseCase = new UnsubscribeFromNewsletterUseCase(repository);

export class NewsletterController {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = SubscribeNewsletterSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const subscriber = await subscribeUseCase.execute(validation.data.email);
      return res.status(200).json({ success: true, data: subscriber });
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const emailInput = req.body?.email || req.query.email;
      const validation = UnsubscribeNewsletterSchema.safeParse({
        email: emailInput,
      });
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const subscriber = await unsubscribeUseCase.execute(
        validation.data.email
      );
      return res.status(200).json({ success: true, data: subscriber });
    } catch (error: any) {
      if (error.message === 'Subscriber not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
