import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaCashTurnRepository } from '@infrastructure/database/repositories/PrismaCashTurnRepository';
import { PrismaCashMovementRepository } from '@infrastructure/database/repositories/PrismaCashMovementRepository';
import { OpenCashTurnUseCase } from '@application/use-cases/pos/OpenCashTurnUseCase';
import { RegisterCashMovementUseCase } from '@application/use-cases/pos/RegisterCashMovementUseCase';
import { CloseCashTurnUseCase } from '@application/use-cases/pos/CloseCashTurnUseCase';
import prisma from '@infrastructure/database/prisma';

// DI Manual
const cashTurnRepository = new PrismaCashTurnRepository();
const cashMovementRepository = new PrismaCashMovementRepository();
const openCashTurnUseCase = new OpenCashTurnUseCase(cashTurnRepository);
const registerCashMovementUseCase = new RegisterCashMovementUseCase(cashTurnRepository, cashMovementRepository);
const closeCashTurnUseCase = new CloseCashTurnUseCase(cashTurnRepository, cashMovementRepository);

// Schemas de Zod
const OpenCashTurnSchema = z.object({
  registerId: z.number().int().positive('El ID de la caja debe ser un entero positivo'),
  openAmount: z.number().nonnegative('El monto inicial no puede ser negativo'),
});

const RegisterMovementSchema = z.object({
  type: z.enum(['INGRESO', 'EGRESO']),
  amount: z.number().positive('El monto debe ser un número positivo'),
  reason: z.string().min(3, 'La razón debe tener al menos 3 caracteres'),
});

const CloseTurnSchema = z.object({
  closeAmount: z.number().min(0, 'El monto de cierre no puede ser negativo').optional(),
});

const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class CashTurnController {
  /**
   * POST /api/v1/cash-turns/open
   *
   * Abre un turno de caja para el vendedor autenticado.
   * Solo accesible por Administrador (ADMIN) o Vendedor (SELLER).
   */
  async open(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validar Roles
      const role = req.auth?.role;
      if (role !== 'ADMIN' && role !== 'SELLER') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: Solo los roles Administrador o Vendedor están autorizados para abrir caja',
        });
      }

      // 2. Validar Schema
      const validation = OpenCashTurnSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      // 3. Ejecutar Caso de Uso
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      const result = await openCashTurnUseCase.execute({
        registerId: validation.data.registerId,
        userId,
        openAmount: validation.data.openAmount,
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('ya tiene') || error.message?.includes('ya tiene un turno abierto')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/cash-registers?branchId=...
   * Lista todas las cajas registradoras asociadas a una sucursal.
   */
  async getRegisters(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = parseInt(String(req.query.branchId), 10);
      if (isNaN(branchId)) {
        return res.status(400).json({ success: false, error: 'El parámetro branchId es obligatorio y debe ser un número entero' });
      }

      const registers = await cashTurnRepository.findRegistersByBranch(branchId);
      return res.status(200).json({ success: true, data: registers });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cash-turns/active
   * Retorna el turno de caja abierto del usuario autenticado si es que existe.
   */
  async getActiveTurn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      const activeTurn = await cashTurnRepository.findActiveByUser(userId);
      return res.status(200).json({ success: true, data: activeTurn });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pos/turns/:id/sales
   * Lista las ventas realizadas durante un turno específico.
   * Filtros opcionales: ?status=COMPLETED & method=CASH
   */
  async getSalesByTurn(req: Request, res: Response, next: NextFunction) {
    try {
      const turnId = parseInt(String(req.params.id), 10);
      const status = req.query.status as string | undefined;
      const method = req.query.method as string | undefined;

      if (isNaN(turnId)) {
        return res.status(400).json({ success: false, error: 'El ID del turno debe ser un número entero' });
      }

      // 1. Obtener el turno
      const turn = await prisma.cashTurn.findUnique({
        where: { id: turnId }
      });

      if (!turn) {
        return res.status(404).json({ success: false, error: 'Turno de caja no encontrado' });
      }

      // 2. Construir la consulta de ventas (PosOrder)
      const whereClause: any = {
        userId: turn.userId,
        createdAt: {
          gte: turn.openedAt,
        }
      };

      if (turn.closedAt) {
        whereClause.createdAt.lte = turn.closedAt;
      }

      if (status) {
        whereClause.status = status.toUpperCase();
      }

      if (method) {
        whereClause.payments = {
          some: {
            method: method.toUpperCase()
          }
        };
      }

      // 3. Ejecutar consulta
      const sales = await prisma.posOrder.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          payments: true,
          items: {
            include: {
              variant: {
                include: { product: true }
              }
            }
          }
        }
      });

      return res.status(200).json({ success: true, data: sales });
    } catch (error: any) {
      console.error('[CashTurnController] Error obteniendo ventas del turno:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/cash-turns/:id/movements
   * Registra un movimiento de caja (ingreso o egreso) en un turno abierto.
   */
  async registerMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const turnId = parseInt(String(req.params.id), 10);
      if (isNaN(turnId)) {
        return res.status(400).json({ success: false, error: 'El ID del turno debe ser un número entero' });
      }

      const validation = RegisterMovementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const movement = await registerCashMovementUseCase.execute({
        turnId,
        type: validation.data.type,
        amount: validation.data.amount,
        reason: validation.data.reason,
      });

      return res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('cerrado')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/cash-turns/:id/movements
   * Lista los movimientos de caja de un turno.
   */
  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const turnId = parseInt(String(req.params.id), 10);
      if (isNaN(turnId)) {
        return res.status(400).json({ success: false, error: 'El ID del turno debe ser un número entero' });
      }

      const movements = await cashMovementRepository.findByTurnId(turnId);
      return res.status(200).json({ success: true, data: movements });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cash-turns/:id/close
   * Cierra un turno de caja y retorna el resumen de cierre.
   */
  async closeTurn(req: Request, res: Response, next: NextFunction) {
    try {
      const turnId = parseInt(String(req.params.id), 10);
      if (isNaN(turnId)) {
        return res.status(400).json({ success: false, error: 'El ID del turno debe ser un número entero' });
      }

      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      const validation = CloseTurnSchema.safeParse(req.body || {});
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const summary = await closeCashTurnUseCase.execute({
        turnId,
        userId,
        closeAmount: validation.data?.closeAmount,
      });

      return res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('cerrado') || error.message?.includes('permiso')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}

