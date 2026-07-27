import prisma from '@infrastructure/database/prisma';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User, CreateUserDTO } from '@domain/entities/User';

/**
 * Adaptador de infraestructura: Implementación del repositorio de usuarios con Prisma.
 * Mapea entre el modelo de Prisma y la entidad del dominio.
 */
export class PrismaUserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { id },
      include: { roles: true, employee: { select: { branchId: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { email },
      include: { roles: true, employee: { select: { branchId: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  /**
   * HU-001: Busca un usuario por su Google ID (OAuth).
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { googleId },
      include: { roles: true, employee: { select: { branchId: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateUserDTO, tx?: any): Promise<User> {
    const client = tx || prisma;
    const record = await client.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        password: data.password,
        googleId: data.googleId ?? null,
        avatarUrl: data.avatarUrl ?? null,
        authProvider: data.authProvider ?? 'local',
        isActive: data.isActive ?? false,
        mustChangePassword: data.mustChangePassword ?? false,
        roles: {
          connect: { name: 'CLIENT' },
        },
      },
      include: { roles: true, employee: { select: { branchId: true } } },
    });
    return this.toDomain(record);
  }

  /**
   * RF-17: Actualiza el campo lastLogin del usuario.
   */
  async updateLastLogin(userId: number, date: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: date },
    });
  }

  async updateVerificationPin(
    userId: number,
    pin: string,
    expiresAt: Date
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationPin: pin,
        pinExpiresAt: expiresAt,
      },
    });
  }

  async deleteById(userId: number): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * RF-03: Activa el usuario y limpia los campos del PIN por seguridad.
   */
  async activateUser(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        verificationPin: null,
        pinExpiresAt: null,
      },
    });
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        mustChangePassword: false,
      },
    });
  }

  /**
   * HU-009 / T-049: Toggles the isActive flag for admin-driven status management.
   * The isActive field (Boolean, default false) was introduced in migration
   * 20260510093523_add_user_is_active. This method exposes it as a writable
   * operation for the admin status endpoint (T-050).
   */
  async updateStatus(userId: number, isActive: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  /**
   * HU-001: Vincula un Google ID a un usuario existente (email match).
   */
  async updateGoogleId(
    userId: number,
    googleId: string,
    avatarUrl?: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        avatarUrl: avatarUrl ?? undefined,
        authProvider: 'google',
      },
    });
  }

  /**
   * HU-005: Actualiza los datos de perfil de un usuario cliente.
   */
  async updateProfile(
    userId: number,
    data: Partial<
      Pick<User, 'name' | 'lastName' | 'phone' | 'avatarUrl' | 'birthdate'>
    >
  ): Promise<User> {
    const record = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        birthdate: data.birthdate !== undefined ? data.birthdate : undefined,
      },
    });
    return this.toDomain(record);
  }

  async findUsersByRoleName(roleName: string): Promise<User[]> {
    const records = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: roleName,
          },
        },
      },
      include: {
        roles: true,
        employee: true,
      },
    });

    return records.map((record: any) => this.toDomain(record));
  }

  /**
   * Mapea el registro de Prisma a la entidad del dominio,
   * desacoplando los tipos de Prisma del dominio.
   */
  private toDomain(record: any): User {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      password: record.password,
      googleId: record.googleId,
      avatarUrl: record.avatarUrl,
      lastName: record.lastName,
      phone: record.phone,
      authProvider: record.authProvider,
      lastLogin: record.lastLogin,
      isActive: record.isActive,
      mustChangePassword: record.mustChangePassword,
      verificationPin: record.verificationPin,
      pinExpiresAt: record.pinExpiresAt,
      roles: record.roles ? record.roles.map((r: any) => r.name) : undefined,
      branchId: record.employee?.branchId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
