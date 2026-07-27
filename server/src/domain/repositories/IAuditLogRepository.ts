import {
  AuditLog,
  CreateAuditLogDTO,
  AuditLogFilters,
} from '@domain/entities/AuditLog';

/**
 * Port: Repositorio de logs de auditoría (puerto del dominio).
 * RF-84: Solo permite creación y lectura (inmutabilidad).
 * No expone métodos de update ni delete.
 */
export interface IAuditLogRepository {
  create(data: CreateAuditLogDTO): Promise<AuditLog>;
  findAll(filters?: AuditLogFilters): Promise<AuditLog[]>;
  findById(id: number): Promise<AuditLog | null>;
}
