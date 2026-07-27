import prisma from '@infrastructure/database/prisma';
import { IAuditLogRepository } from '@domain/repositories/IAuditLogRepository';
import {
  AuditLog,
  CreateAuditLogDTO,
  AuditLogFilters,
} from '@domain/entities/AuditLog';

/**
 * Adaptador de infraestructura: Implementación del repositorio de auditoría con Prisma.
 * RF-84: Solo permite creación y lectura (inmutabilidad).
 * No expone métodos update ni delete.
 */
export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: CreateAuditLogDTO): Promise<AuditLog> {
    const record = await prisma.auditLog.create({
      data: {
        action: data.action,
        module: data.module,
        userId: data.userId ?? null,
        details: data.details
          ? JSON.parse(JSON.stringify(data.details))
          : undefined,
      },
    });
    return this.toDomain(record);
  }

  async findAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};

    if (filters?.module) {
      where.module = filters.module;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.userId !== undefined) {
      where.userId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }

    const records = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r: { id: number; action: string; module: string; details: unknown; userId: number | null; createdAt: Date }) => this.toDomain(r));
  }

  async findById(id: number): Promise<AuditLog | null> {
    const record = await prisma.auditLog.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  /**
   * Mapea el registro de Prisma a la entidad del dominio.
   */
  private toDomain(record: {
    id: number;
    action: string;
    module: string;
    details: unknown;
    userId: number | null;
    createdAt: Date;
  }): AuditLog {
    return {
      id: record.id,
      action: record.action,
      module: record.module,
      details: (record.details as Record<string, unknown>) ?? null,
      userId: record.userId,
      createdAt: record.createdAt,
    };
  }
}
