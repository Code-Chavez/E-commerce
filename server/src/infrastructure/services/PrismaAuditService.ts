import { IAuditService, AuditData } from '@domain/services/AuditService';
import { IAuditLogRepository } from '@domain/repositories/IAuditLogRepository';
import { AuditLog, AuditLogFilters } from '@domain/entities/AuditLog';

/**
 * Implementación del servicio de auditoría usando el repositorio (puerto).
 * Desacoplado de Prisma: recibe el repositorio por inyección de dependencias.
 */
export class PrismaAuditService implements IAuditService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async record(data: AuditData): Promise<void> {
    await this.auditLogRepository.create({
      action: data.action,
      module: data.module,
      userId: data.userId,
      details: data.details,
    });
  }

  async getAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
    return this.auditLogRepository.findAll(filters);
  }

  async getById(id: number): Promise<AuditLog | null> {
    return this.auditLogRepository.findById(id);
  }
}