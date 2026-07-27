import { Request, Response } from 'express';
import { RegisterCreditUseCase } from '@application/use-cases/credits/RegisterCreditUseCase';
import { RegisterPaymentUseCase } from '@application/use-cases/credits/RegisterPaymentUseCase';
import { GetPendingBalanceUseCase } from '@application/use-cases/credits/GetPendingBalanceUseCase';
import { CreateCreditDTOSchema, CreatePaymentDTOSchema } from '@application/dtos/CreditDTO';

export class CreditController {
  constructor(
    private readonly registerCreditUseCase: RegisterCreditUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly getPendingBalanceUseCase: GetPendingBalanceUseCase
  ) {}

  public registerCredit = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = CreateCreditDTOSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const credit = await this.registerCreditUseCase.execute(parsed.data);
      res.status(201).json(credit);
    } catch (error: any) {
      console.error('[CreditController] registerCredit error:', error);
      res.status(400).json({ error: error.message || 'Error interno del servidor.' });
    }
  };

  public registerPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'El ID de crédito es requerido.' });
        return;
      }

      const parsed = CreatePaymentDTOSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const payment = await this.registerPaymentUseCase.execute(id, parsed.data);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error('[CreditController] registerPayment error:', error);
      res.status(400).json({ error: error.message || 'Error interno del servidor.' });
    }
  };

  public getPendingBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.query;
      if (!clientId) {
        res.status(400).json({ error: 'El parámetro clientId es obligatorio.' });
        return;
      }

      const parsedClientId = Number(clientId);
      if (isNaN(parsedClientId) || parsedClientId <= 0) {
        res.status(400).json({ error: 'El parámetro clientId debe ser un número entero positivo.' });
        return;
      }

      const balance = await this.getPendingBalanceUseCase.execute(parsedClientId);
      res.status(200).json(balance);
    } catch (error: any) {
      console.error('[CreditController] getPendingBalance error:', error);
      res.status(400).json({ error: error.message || 'Error interno del servidor.' });
    }
  };
}
