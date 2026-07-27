import { IRoleRepository } from '@domain/repositories/IRoleRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { Role, CreateRoleDTO } from '@domain/entities/Role';

/**
 * Application Service: Orchestrates access control business logic (HU-004).
 * Coordinates user and role repositories to enforce secure dynamic binding.
 */
export class RoleService {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Instantiates a new role validating universal name uniqueness.
   */
  async createRole(dto: CreateRoleDTO): Promise<Role> {
    // 1. Verify specified role name collision
    const existingRole = await this.roleRepository.findByName(dto.name);
    if (existingRole) {
      throw new Error(`El rol '${dto.name}' ya existe en el sistema`);
    }

    // 2. Commit to persistent storage
    return await this.roleRepository.create(dto);
  }

  /**
   * Binds a verified security role to a distinct user entity.
   */
  async assignRole(userId: number, roleName: string): Promise<void> {
    // 1. Verify target user identity exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verify explicit role catalog existence
    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new Error(`El rol '${roleName}' no está definido en el sistema`);
    }

    // 3. Execute secure relational link
    await this.roleRepository.assignRoleToUser(user.id, role.id);
  }

  /**
   * Unbinds specific role from user matrix without collateral access pollution.
   */
  async revokeRole(userId: number, roleName: string): Promise<void> {
    // 1. Verify target user existence
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verify specified role existence
    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new Error(`El rol '${roleName}' no existe`);
    }

    // 3. Revoke active link
    await this.roleRepository.revokeRoleFromUser(user.id, role.id);
  }
}
