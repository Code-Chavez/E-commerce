import { Request, Response, NextFunction } from 'express';
import { GetActiveAttributesForFiltersUseCase } from '@application/use-cases/ecommerce/GetActiveAttributesForFiltersUseCase';
import { PrismaAttributeRepository } from '@infrastructure/database/repositories/PrismaAttributeRepository';

const repo = new PrismaAttributeRepository();
const getAttributesUseCase = new GetActiveAttributesForFiltersUseCase(repo);

export class EcommerceAttributeController {
  async getActiveAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getAttributesUseCase.execute();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
}
