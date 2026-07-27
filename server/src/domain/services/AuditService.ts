import { CreateAuditLogDTO, AuditLog, AuditLogFilters } from '@domain/entities/AuditLog';
import { IAuditLogRepository } from '@domain/repositories/IAuditLogRepository';

/**
 * Datos necesarios para registrar una auditoría.
 */
export interface AuditData {
  userId?: number;
  action: string;
  module: string;
  details?: Record<string, unknown>;
}

/**
 * Puerto de servicio de auditoría (dominio).
 * Define la interfaz que cualquier implementación de auditoría debe cumplir.
 */
export interface IAuditService {
  record(data: AuditData): Promise<void>;
  getAll(filters?: AuditLogFilters): Promise<AuditLog[]>;
  getById(id: number): Promise<AuditLog | null>;
}

/**
 * Módulos válidos para auditoría.
 */
export enum AuditModule {
  AUTH = 'AUTH',
  USERS = 'USERS',
  PRICES = 'PRICES',
  STOCK = 'STOCK',
  SALES = 'SALES',
}

/**
 * Acciones válidas para auditoría.
 */
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_USER = 'CREATE_USER',
  UPDATE_PRICE = 'UPDATE_PRICE',
  UPDATE_STOCK = 'UPDATE_STOCK',
  CREATE_SALE = 'CREATE_SALE',
  CANCEL_SALE = 'CANCEL_SALE',
}