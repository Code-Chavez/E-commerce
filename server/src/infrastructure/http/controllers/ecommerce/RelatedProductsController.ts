import { Request, Response, NextFunction } from 'express';
import { GetRelatedProductsUseCase } from '@application/use-cases/ecommerce/GetRelatedProductsUseCase';

export class RelatedProductsController {
  private useCase = new GetRelatedProductsUseCase();

  getRelated = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = parseInt(req.params.id as string, 10);
      if (isNaN(productId)) {
        res
          .status(400)
          .json({ success: false, message: 'ID de producto inválido' });
        return;
      }
      const rawUserId =
        typeof req.query.userId === 'string'
          ? parseInt(req.query.userId, 10)
          : NaN;
      const userId = isNaN(rawUserId) ? undefined : rawUserId;

      const products = await this.useCase.execute(productId, userId);
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  };
}
