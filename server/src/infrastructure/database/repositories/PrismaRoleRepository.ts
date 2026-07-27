import prisma from '@infrastructure/database/prisma';
import { IRoleRepository } from '@domain/repositories/IRoleRepository';
import { Role } from '@domain/entities/Role';

/**
 * Infrastructure Adapter: Concrete repository implementing persistent Role handling via Prisma client.
 */
export class PrismaRoleRepository implements IRoleRepository {
  async findByName(name: string): Promise<Role | null> {
    const record = await prisma.role.findUnique({
      where: { name },
      include: { permissions: true },
    });
    return record as Role | null; // Directly compliant struct
  }

  async findById(id: number): Promise<Role | null> {
    const record = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    return record as Role | null;
  }

  async create(data: { name: string; description?: string | null }): Promise<Role> {
    const record = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });
    return record as Role;
  }

  async findAll(): Promise<Role[]> {
    const records = await prisma.role.findMany({
      include: { permissions: true },
    });
    return records as Role[];
  }

  /**
   * Reemplaza todos los roles del usuario por el nuevo rol especificado (Operation: SET)
   * Esto evita la acumulación involuntaria de roles (HU-049 Fix).
   */
  async assignRoleToUser(userId: number, roleId: number, tx?: any): Promise<void> {
    const client = tx || prisma;
    await client.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [{ id: roleId }],
        },
      },
    });
  }

  /**
   * Remueve todos los roles asignados a un usuario (HU-049 Fix: Sin rol asignado).
   */
  async clearUserRoles(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [],
        },
      },
    });
  }

  async revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
    });
  }
}
