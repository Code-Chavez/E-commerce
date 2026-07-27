import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dniSchema, rucSchema } from '@shared/validation/documentValidators';
import { PrismaClientRepository } from '@infrastructure/database/repositories/PrismaClientRepository';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { PrismaRoleRepository } from '@infrastructure/database/repositories/PrismaRoleRepository';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { PrismaTransactionManager } from '@infrastructure/database/PrismaTransactionManager';
import { LinkClientUseCase } from '@application/use-cases/admin/LinkClientUseCase';
import { BulkLinkClientsUseCase } from '@application/use-cases/admin/BulkLinkClientsUseCase';
import { JwtService } from '@infrastructure/services/JwtService';
import { GetUnifiedClientsUseCase } from '@application/use-cases/admin/GetUnifiedClientsUseCase';
import { GetClientCommunicationsUseCase } from '@application/use-cases/GetClientCommunicationsUseCase';
import { PrismaCommunicationLogRepository } from '@infrastructure/database/repositories/PrismaCommunicationLogRepository';

const clientRepository = new PrismaClientRepository();
const userRepository = new PrismaUserRepository();
const roleRepository = new PrismaRoleRepository();
const emailService = new ResendEmailService();
const transactionManager = new PrismaTransactionManager();
const jwtService = new JwtService();

const linkClientUseCase = new LinkClientUseCase(
  clientRepository,
  userRepository,
  roleRepository,
  emailService,
  transactionManager,
  jwtService
);
const bulkLinkClientsUseCase = new BulkLinkClientsUseCase(linkClientUseCase);
const getUnifiedClientsUseCase = new GetUnifiedClientsUseCase(clientRepository);
const getClientCommunicationsUseCase = new GetClientCommunicationsUseCase(new PrismaCommunicationLogRepository());

const LinkClientSchema = z.object({
  email: z.string().email('Email inválido').optional(),
});

const BulkLinkSchema = z.object({
  ids: z.array(z.number()),
  emails: z.record(z.string(), z.string().email('Email inválido')).optional(),
});

const GetUnifiedClientsQuerySchema = z.object({
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().default(10)),
  type: z.enum(['POS', 'ECOMMERCE', 'ALL']).default('ALL'),
  search: z.string().optional(),
});

const UpdateClientSchema = z.object({
  email: z.string().email('Email inválido').nullable().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  documentType: z.string().nullable().optional(),
  documentId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  ubigeo: z.string().nullable().optional(),
}).superRefine((val, ctx) => {
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


export class ClientController {
  /**
   * GET /api/v1/admin/clients/unlinked
   * List POS clients without an e-commerce account.
   */
  async getUnlinkedClients(_req: Request, res: Response, next: NextFunction) {
    try {
      const clients = await clientRepository.findAllWithoutUser();
      return res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  /**
   * T-057: POST /api/v1/admin/clients/:id/link
   */
  async linkClient(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = parseInt(String(req.params.id), 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: 'ID de cliente inválido' });
      }

      const validation = LinkClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }

      const result = await linkClientUseCase.execute(clientId, validation.data.email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * T-058: POST /api/v1/admin/clients/bulk-link
   */
  async bulkLink(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = BulkLinkSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }

      // Convert string keys from JSON to number keys expected by the use case
      const emails = validation.data.emails
        ? Object.fromEntries(
            Object.entries(validation.data.emails).map(([k, v]) => [Number(k), v])
          ) as Record<number, string>
        : undefined;

      const report = await bulkLinkClientsUseCase.execute(validation.data.ids, emails);
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/clients
   * List unified base clients with filters and pagination.
   */
  async getUnifiedClients(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = GetUnifiedClientsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        const mappedErrors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ success: false, error: mappedErrors });
      }

      const { page, limit, type, search } = validation.data;
      const result = await getUnifiedClientsUseCase.execute({
        page,
        limit,
        type,
        search,
      });

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/clients/:id
   * Update client details.
   */
  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = parseInt(String(req.params.id), 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: 'ID de cliente inválido' });
      }

      const validation = UpdateClientSchema.safeParse(req.body);
      if (!validation.success) {
        const mappedErrors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ success: false, error: mappedErrors });
      }

      const existing = await clientRepository.findById(clientId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      }

      // If email is changing, verify it is not already used by another client
      if (validation.data.email && validation.data.email !== existing.email) {
        const emailExists = await clientRepository.findByEmail(validation.data.email);
        if (emailExists && emailExists.id !== clientId) {
          return res.status(400).json({
            success: false,
            error: [{ field: 'email', message: 'El correo electrónico ya está registrado por otro cliente' }],
          });
        }
      }

      const updated = await clientRepository.update(clientId, validation.data);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/clients/:id/communications
   * HU-089: Get client's communication history
   */
  async getClientCommunications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = Number(req.params.id);
      if (isNaN(clientId)) {
        res.status(400).json({ success: false, message: 'Invalid client ID' });
        return;
      }

      const logs = await getClientCommunicationsUseCase.execute(clientId);
      res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      next(error);
    }
  }
}


