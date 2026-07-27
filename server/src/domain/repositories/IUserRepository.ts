import { User, CreateUserDTO } from '@domain/entities/User';

/**
 * Port: Repositorio de usuarios (puerto del dominio).
 * Define las operaciones permitidas sin acoplarse a la infraestructura.
 */
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(data: CreateUserDTO, tx?: any): Promise<User>;
  updateLastLogin(userId: number, date: Date): Promise<void>;
  updateVerificationPin(userId: number, pin: string, expiresAt: Date): Promise<void>;
  deleteById(userId: number): Promise<void>;
  activateUser(userId: number): Promise<void>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;
  updateGoogleId(userId: number, googleId: string, avatarUrl?: string): Promise<void>;
  /** HU-009 / T-049: Enable or disable a user account (admin operation). */
  updateStatus(userId: number, isActive: boolean): Promise<void>;
  /** HU-005: Update client's profile information. */
  updateProfile(
    userId: number,
    data: Partial<Pick<User, 'name' | 'lastName' | 'phone' | 'avatarUrl' | 'birthdate'>>
  ): Promise<User>;
  findUsersByRoleName(roleName: string): Promise<User[]>;
}

