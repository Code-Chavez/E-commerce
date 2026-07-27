import { IAuditService, AuditData } from '@domain/services/AuditService';
import { AuditLog, AuditLogFilters } from '@domain/entities/AuditLog';
import { AuditLogResponseDTO } from '@application/dtos/audit-log.dto';

/**
 * Caso de uso: Registrar una entrada de auditoría.
 * RF-84: Cada acción crítica (precios, stock, ventas) genera un registro
 * con el usuario responsable y la descripción.
 */
export class RecordAuditUseCase {
  constructor(private readonly auditService: IAuditService) {}

  async execute(data: AuditData): Promise<void> {
    await this.auditService.record(data);
  }
}

/**
 * Caso de uso: Consultar registros de auditoría.
 * RF-84: Permite leer registros con filtros opcionales.
 */
export class GetAuditLogsUseCase {
  constructor(private readonly auditService: IAuditService) {}

  async execute(filters?: AuditLogFilters): Promise<AuditLogResponseDTO[]> {
    const logs = await this.auditService.getAll(filters);
    return logs.map((log) => this.toResponseDTO(log));
  }

  private toResponseDTO(log: AuditLog): AuditLogResponseDTO {
    return {
      id: log.id,
      action: log.action,
      module: log.module,
      details: log.details,
      userId: log.userId,
      createdAt: log.createdAt,
    };
  }
}
