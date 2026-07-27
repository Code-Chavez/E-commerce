import { Request, Response, NextFunction } from 'express';
import { ReconcileStripeDTOSchema } from '@application/reconciliation/dtos/ReconcileStripeDTO';
import { StripeReconciliationService } from '@application/reconciliation/services/StripeReconciliationService';
import { StripePaymentAdapter } from '@infrastructure/adapters/stripe/StripePaymentAdapter';
import { PrismaOrderReconciliationAdapter } from '@infrastructure/adapters/database/PrismaOrderReconciliationAdapter';

export class AdminReconciliationController {
  private service: StripeReconciliationService;

  constructor() {
    const stripePaymentPort = new StripePaymentAdapter();
    const orderRepositoryPort = new PrismaOrderReconciliationAdapter();
    this.service = new StripeReconciliationService(stripePaymentPort, orderRepositoryPort);
  }

  reconcileStripe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = ReconcileStripeDTOSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { from, to } = validation.data;
      const fromDate = new Date(from);
      const toDate = new Date(to);

      const result = await this.service.execute(fromDate, toDate);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
