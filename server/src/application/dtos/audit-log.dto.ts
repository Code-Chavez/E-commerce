/**
 * DTO de respuesta de log de auditoría.
 * RF-84: Define la forma de los datos que se exponen al consumidor
 * desde el caso de uso GetAuditLogsUseCase.
 * Pertenece a la capa de aplicación, no al dominio.
 */
export interface AuditLogResponseDTO {
  id: number;
  action: string;
  module: string;
  details: Record<string, unknown> | null;
  userId: number | null;
  createdAt: Date;
}
