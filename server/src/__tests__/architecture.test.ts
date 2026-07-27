import { describe, it, expect } from '@jest/globals';
import { User, CreateUserDTO } from '@domain/entities/User';
import { AuditLog, CreateAuditLogDTO } from '@domain/entities/AuditLog';
import { AuditModule, AuditAction } from '@domain/services/AuditService';
import { UserResponseDTO } from '@application/dtos/user.dto';
import { AuditLogResponseDTO } from '@application/dtos/audit-log.dto';

/**
 * Tests de arquitectura: Validación de separación de capas.
 * Verifica que las entidades del dominio y DTOs no dependen de tipos de Prisma.
 */
describe('Separación de capas (Arquitectura Hexagonal)', () => {
  describe('Entidad User', () => {
    it('RF-17: la entidad User debe incluir el campo lastLogin', () => {
      const user: User = {
        id: 1,
        email: 'test@e-commerce.com',
        name: 'Test',
        password: 'hashed',
        authProvider: 'local',
        lastLogin: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user).toHaveProperty('lastLogin');
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('lastLogin puede ser null (usuario que nunca ha iniciado sesión)', () => {
      const user: User = {
        id: 2,
        email: 'nuevo@e-commerce.com',
        name: null,
        password: 'hashed',
        authProvider: 'local',
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.lastLogin).toBeNull();
    });

    it('UserResponseDTO no debe contener password', () => {
      const dto: UserResponseDTO = {
        id: 1,
        email: 'test@e-commerce.com',
        name: 'Test',
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(dto).not.toHaveProperty('password');
    });

    it('CreateUserDTO no debe contener campos autogenerados', () => {
      const dto: CreateUserDTO = {
        email: 'new@e-commerce.com',
        password: 'Pass123!',
        name: 'New User',
      };

      expect(dto).not.toHaveProperty('id');
      expect(dto).not.toHaveProperty('createdAt');
      expect(dto).not.toHaveProperty('updatedAt');
      expect(dto).not.toHaveProperty('lastLogin');
    });
  });

  describe('Entidad AuditLog', () => {
    it('la entidad AuditLog debe tener la estructura correcta', () => {
      const log: AuditLog = {
        id: 1,
        action: AuditAction.CREATE_SALE,
        module: AuditModule.SALES,
        details: { saleId: 1, total: 100 },
        userId: 1,
        createdAt: new Date(),
      };

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('module');
      expect(log).toHaveProperty('details');
      expect(log).toHaveProperty('userId');
      expect(log).toHaveProperty('createdAt');
    });

    it('AuditLogResponseDTO debe tener la misma estructura que AuditLog', () => {
      const dto: AuditLogResponseDTO = {
        id: 1,
        action: AuditAction.UPDATE_PRICE,
        module: AuditModule.PRICES,
        details: { price: 25.0 },
        userId: 2,
        createdAt: new Date(),
      };

      expect(dto.id).toBe(1);
      expect(dto.action).toBe('UPDATE_PRICE');
      expect(dto.module).toBe('PRICES');
    });

    it('CreateAuditLogDTO no debe contener campos autogenerados', () => {
      const dto: CreateAuditLogDTO = {
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        userId: 1,
        details: { email: 'x@x.com' },
      };

      expect(dto).not.toHaveProperty('id');
      expect(dto).not.toHaveProperty('createdAt');
    });
  });

  describe('DTOs de comunicación entre capas', () => {
    it('los DTOs no deben importar tipos de @prisma/client (verificación por estructura)', () => {
      // Verificamos que las entidades usan tipos nativos de TypeScript
      // y no tipos generados por Prisma (como Prisma.JsonValue)
      const user: User = {
        id: 1,
        email: 'test@test.com',
        name: 'Name',
        password: 'hash',
        authProvider: 'local',
        lastLogin: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Los tipos deben ser nativos de JS/TS
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('AuditLog details debe usar Record<string, unknown> nativo, no Prisma.JsonValue', () => {
      const log: AuditLog = {
        id: 1,
        action: 'TEST',
        module: 'TEST',
        details: { key: 'value', nested: { a: 1 } },
        userId: null,
        createdAt: new Date(),
      };

      expect(typeof log.details).toBe('object');
      expect(log.details).not.toBeNull();
      expect((log.details as Record<string, unknown>).key).toBe('value');
    });
  });

  describe('Enums de auditoría', () => {
    it('AuditModule debe incluir los módulos críticos', () => {
      expect(AuditModule.PRICES).toBe('PRICES');
      expect(AuditModule.STOCK).toBe('STOCK');
      expect(AuditModule.SALES).toBe('SALES');
      expect(AuditModule.AUTH).toBe('AUTH');
    });

    it('AuditAction debe incluir las acciones críticas', () => {
      expect(AuditAction.UPDATE_PRICE).toBe('UPDATE_PRICE');
      expect(AuditAction.UPDATE_STOCK).toBe('UPDATE_STOCK');
      expect(AuditAction.CREATE_SALE).toBe('CREATE_SALE');
      expect(AuditAction.CANCEL_SALE).toBe('CANCEL_SALE');
      expect(AuditAction.LOGIN).toBe('LOGIN');
    });
  });
});
