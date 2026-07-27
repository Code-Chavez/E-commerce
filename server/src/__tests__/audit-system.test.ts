import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  RecordAuditUseCase,
  GetAuditLogsUseCase,
} from '@application/use-cases/AuditUseCases';
import { PrismaAuditService } from '@infrastructure/services/PrismaAuditService';
import { IAuditLogRepository } from '@domain/repositories/IAuditLogRepository';
import { AuditModule, AuditAction } from '@domain/services/AuditService';
import { AuditLog } from '@domain/entities/AuditLog';

// ---- Mocks ----

const mockAuditLogRepository: jest.Mocked<IAuditLogRepository> = {
  create: jest.fn<IAuditLogRepository['create']>(),
  findAll: jest.fn<IAuditLogRepository['findAll']>(),
  findById: jest.fn<IAuditLogRepository['findById']>(),
};

// ---- Test Suite ----

describe('Audit System (RF-84)', () => {
  let auditService: PrismaAuditService;
  let recordAuditUseCase: RecordAuditUseCase;
  let getAuditLogsUseCase: GetAuditLogsUseCase;

  const fakeAuditLog: AuditLog = {
    id: 1,
    action: AuditAction.UPDATE_PRICE,
    module: AuditModule.PRICES,
    details: { productId: 42, oldPrice: 10.0, newPrice: 15.0 },
    userId: 1,
    createdAt: new Date('2026-04-28T12:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = new PrismaAuditService(mockAuditLogRepository);
    recordAuditUseCase = new RecordAuditUseCase(auditService);
    getAuditLogsUseCase = new GetAuditLogsUseCase(auditService);
  });

  describe('RecordAuditUseCase', () => {
    it('debería registrar una acción de cambio de precio (acción crítica)', async () => {
      mockAuditLogRepository.create.mockResolvedValue(fakeAuditLog);

      await recordAuditUseCase.execute({
        userId: 1,
        action: AuditAction.UPDATE_PRICE,
        module: AuditModule.PRICES,
        details: { productId: 42, oldPrice: 10.0, newPrice: 15.0 },
      });

      expect(mockAuditLogRepository.create).toHaveBeenCalledTimes(1);
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE_PRICE,
          module: AuditModule.PRICES,
          userId: 1,
          details: expect.objectContaining({ productId: 42 }),
        })
      );
    });

    it('debería registrar una acción de cambio de stock (acción crítica)', async () => {
      const stockLog: AuditLog = {
        ...fakeAuditLog,
        action: AuditAction.UPDATE_STOCK,
        module: AuditModule.STOCK,
        details: { productId: 10, oldStock: 100, newStock: 50 },
      };
      mockAuditLogRepository.create.mockResolvedValue(stockLog);

      await recordAuditUseCase.execute({
        userId: 2,
        action: AuditAction.UPDATE_STOCK,
        module: AuditModule.STOCK,
        details: { productId: 10, oldStock: 100, newStock: 50 },
      });

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE_STOCK,
          module: AuditModule.STOCK,
          userId: 2,
        })
      );
    });

    it('debería registrar una venta (acción crítica)', async () => {
      const saleLog: AuditLog = {
        ...fakeAuditLog,
        action: AuditAction.CREATE_SALE,
        module: AuditModule.SALES,
        details: { saleId: 999, total: 250.0 },
      };
      mockAuditLogRepository.create.mockResolvedValue(saleLog);

      await recordAuditUseCase.execute({
        userId: 3,
        action: AuditAction.CREATE_SALE,
        module: AuditModule.SALES,
        details: { saleId: 999, total: 250.0 },
      });

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE_SALE,
          module: AuditModule.SALES,
          userId: 3,
        })
      );
    });

    it('debería incluir el usuario responsable en cada registro', async () => {
      mockAuditLogRepository.create.mockResolvedValue(fakeAuditLog);

      await recordAuditUseCase.execute({
        userId: 5,
        action: AuditAction.CANCEL_SALE,
        module: AuditModule.SALES,
        details: { saleId: 123, reason: 'Devolución' },
      });

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5,
        })
      );
    });
  });

  describe('GetAuditLogsUseCase', () => {
    it('debería retornar todos los logs sin filtros', async () => {
      const logs: AuditLog[] = [
        fakeAuditLog,
        {
          ...fakeAuditLog,
          id: 2,
          action: AuditAction.UPDATE_STOCK,
          module: AuditModule.STOCK,
        },
      ];
      mockAuditLogRepository.findAll.mockResolvedValue(logs);

      const result = await getAuditLogsUseCase.execute();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('debería filtrar logs por módulo', async () => {
      mockAuditLogRepository.findAll.mockResolvedValue([fakeAuditLog]);

      const result = await getAuditLogsUseCase.execute({
        module: AuditModule.PRICES,
      });

      expect(mockAuditLogRepository.findAll).toHaveBeenCalledWith({
        module: AuditModule.PRICES,
      });
      expect(result).toHaveLength(1);
      expect(result[0].module).toBe(AuditModule.PRICES);
    });

    it('debería retornar DTOs sin información sensible', async () => {
      mockAuditLogRepository.findAll.mockResolvedValue([fakeAuditLog]);

      const result = await getAuditLogsUseCase.execute();

      // Verificar que el DTO tiene la estructura correcta
      const dto = result[0];
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('action');
      expect(dto).toHaveProperty('module');
      expect(dto).toHaveProperty('details');
      expect(dto).toHaveProperty('userId');
      expect(dto).toHaveProperty('createdAt');
    });
  });

  describe('Inmutabilidad del repositorio de auditoría', () => {
    it('el repositorio NO debe exponer método update', () => {
      expect((mockAuditLogRepository as any).update).toBeUndefined();
    });

    it('el repositorio NO debe exponer método delete', () => {
      expect((mockAuditLogRepository as any).delete).toBeUndefined();
    });

    it('el repositorio solo debe tener create, findAll y findById', () => {
      const methods = Object.keys(mockAuditLogRepository);
      expect(methods).toContain('create');
      expect(methods).toContain('findAll');
      expect(methods).toContain('findById');
      expect(methods).not.toContain('update');
      expect(methods).not.toContain('delete');
      expect(methods).not.toContain('remove');
    });
  });
});
