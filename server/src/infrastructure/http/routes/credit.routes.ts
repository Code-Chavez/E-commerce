import { Router } from 'express';
import { CreditController } from '@infrastructure/http/controllers/CreditController';
import { PrismaClientCreditRepository } from '@infrastructure/database/repositories/PrismaClientCreditRepository';
import { PrismaClientRepository } from '@infrastructure/database/repositories/PrismaClientRepository';
import { RegisterCreditUseCase } from '@application/use-cases/credits/RegisterCreditUseCase';
import { RegisterPaymentUseCase } from '@application/use-cases/credits/RegisterPaymentUseCase';
import { GetPendingBalanceUseCase } from '@application/use-cases/credits/GetPendingBalanceUseCase';

const creditRepository = new PrismaClientCreditRepository();
const clientRepository = new PrismaClientRepository();

const registerCreditUseCase = new RegisterCreditUseCase(creditRepository, clientRepository);
const registerPaymentUseCase = new RegisterPaymentUseCase(creditRepository);
const getPendingBalanceUseCase = new GetPendingBalanceUseCase(creditRepository, clientRepository);

const controller = new CreditController(
  registerCreditUseCase,
  registerPaymentUseCase,
  getPendingBalanceUseCase
);

const router = Router();

router.post('/credits', controller.registerCredit.bind(controller));
router.post('/credits/:id/payments', controller.registerPayment.bind(controller));
router.get('/credits', controller.getPendingBalance.bind(controller));

export default router;
