import { Request, Response, NextFunction } from 'express';
import { GetOnSaleProductsUseCase } from '@application/use-cases/ecommerce/GetOnSaleProductsUseCase';

const getOnSaleProductsUseCase = new GetOnSaleProductsUseCase();

export class ProductOnSaleController {
  async getOnSale(req: Request, res: Response, next: NextFunction) {
    try {
      const resultData = await getOnSaleProductsUseCase.execute();

      return res.status(200).json({
        success: true,
        data: resultData,
      });
    } catch (error) {
      next(error);
    }
  }
}

