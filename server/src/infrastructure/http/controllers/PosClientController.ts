import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QuickRegisterClientUseCase } from '@application/use-cases/pos/QuickRegisterClientUseCase';
import { FactilizaService } from '@infrastructure/services/FactilizaService';
import { PrismaClientRepository } from '@infrastructure/database/repositories/PrismaClientRepository';
import { SearchPosClientsUseCase } from '@application/use-cases/pos/SearchPosClientsUseCase';
import prisma from '@infrastructure/database/prisma';

const quickRegisterUseCase = new QuickRegisterClientUseCase();
const factilizaService = new FactilizaService();
const clientRepository = new PrismaClientRepository();
const searchUseCase = new SearchPosClientsUseCase(clientRepository);

import { dniSchema, rucSchema } from '@shared/validation/documentValidators';

const QuickRegisterSchema = z
  .object({
    documentType: z.enum(['DNI', 'RUC']),
    documentId: z.string(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    branchId: z.number().int().positive('El ID de sucursal es obligatorio'),
    phone: z.string().optional().nullable(),
    email: z
      .string()
      .email('El formato del correo electrónico es inválido')
      .optional()
      .or(z.literal(''))
      .nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.documentType === 'DNI' && val.documentId) {
      const parsed = dniSchema.safeParse(val.documentId);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message || 'DNI Inválido',
          path: ['documentId'],
        });
      }
    }

    if (val.documentType === 'RUC' && val.documentId) {
      const parsed = rucSchema.safeParse(val.documentId);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message || 'RUC Inválido',
          path: ['documentId'],
        });
      }
    }
  });

const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class PosClientController {
  /**
   * POST /api/v1/pos/clients/quick-register
   * Realiza el registro rápido de un cliente desde el POS usando la API de Factiliza.
   */
  async quickRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = QuickRegisterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: mapZodErrors(validation.error.issues),
        });
      }

      const { documentType, documentId, phone, email, name, branchId } =
        validation.data;

      const client = await quickRegisterUseCase.execute({
        documentType,
        documentId,
        phone: phone || undefined,
        email: email || undefined,
        name,
        branchId,
      });

      return res.status(201).json({ success: true, data: client });
    } catch (error: any) {
      if (error.statusCode === 409) {
        return res.status(409).json({ success: false, error: error.message });
      }
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/pos/clients/lookup?type=...&number=...
   * Consulta los datos de un cliente predictivo por DNI o RUC en la API de Factiliza.
   */
  async lookup(req: Request, res: Response, next: NextFunction) {
    try {
      const type = String(req.query.type || '').toUpperCase();
      const number = String(req.query.number || '').trim();

      if (type !== 'DNI' && type !== 'RUC') {
        return res.status(400).json({
          success: false,
          error: 'El parámetro type debe ser DNI o RUC',
        });
      }

      if (type === 'DNI' && number.length !== 8) {
        return res.status(400).json({
          success: false,
          error: 'El número de DNI debe tener exactamente 8 dígitos',
        });
      }

      if (type === 'RUC' && number.length !== 11) {
        return res.status(400).json({
          success: false,
          error: 'El número de RUC debe tener exactamente 11 dígitos',
        });
      }

      const result = await factilizaService.lookupDocument(
        type as 'DNI' | 'RUC',
        number
      );
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'Documento no encontrado en el padrón o inválido',
        });
      }

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pos/clients/search?q=...
   * Busca clientes locales por DNI, RUC o Nombre/Apellido con paginación máxima de 10 registros.
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro de búsqueda q es obligatorio',
        });
      }

      const page = parseInt(String(req.query.page || '1'), 10);
      const parsedPage = isNaN(page) || page < 1 ? 1 : page;

      const result = await searchUseCase.execute(q, parsedPage);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      next(error);
    }
  }

  async getLoyaltyBalance(req: Request, res: Response) {
    try {
      const clientId = parseInt(String(req.params.id), 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      // Check if client has user account attached
      const client = await new PrismaClientRepository().findById(clientId);
      if (!client || !client.userId) {
        return res.status(200).json({ success: true, data: { balance: 0 } });
      }

      const account = await prisma.loyaltyAccount.findUnique({
        where: { userId: client.userId },
      });

      return res
        .status(200)
        .json({ success: true, data: { balance: account?.balance || 0 } });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
