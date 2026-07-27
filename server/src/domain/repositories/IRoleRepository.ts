import { Role } from '@domain/entities/Role';

/**
 * Port: Definición del puerto de dominio para la gestión de Roles (RBAC).
 */
export interface IRoleRepository {
  findByName(roleName: string): Promise<Role | null>;
  findById(roleId: number): Promise<Role | null>;
  create(data: { name: string; description?: string | null }): Promise<Role>;
  findAll(): Promise<Role[]>;
  assignRoleToUser(userId: number, roleId: number, tx?: any): Promise<void>;
  clearUserRoles(userId: number): Promise<void>;
  revokeRoleFromUser(userId: number, roleId: number): Promise<void>;
}
