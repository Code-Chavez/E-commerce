import bcrypt from 'bcrypt';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IAuditService, AuditModule, AuditAction } from '@domain/services/AuditService';
import { LoginDTO } from '@application/dtos/AuthDTO';
import { UserResponseDTO } from '@application/dtos/user.dto';
import { JwtService, AuthTokens } from '@infrastructure/services/JwtService';

export interface LoginResultDTO {
  user: UserResponseDTO;
  tokens: AuthTokens;
}

/**
 * Application Use Case: Login with email and password (HU-094).
 *
 * Business rules enforced:
 * 1. User must exist in the system.
 * 2. Password must match the stored bcrypt hash.
 * 3. User account must be active and verified (isActive === true).
 * 4. On any credential failure, throws a generic error to prevent
 *    email enumeration attacks → HTTP 401 at controller level.
 * 5. On inactive/unverified account, throws a distinct error → HTTP 403.
 * 6. On success:
 *    - Updates lastLogin (RF-17)
 *    - Records an audit log entry (RF-84)
 *    - Returns JWT access + refresh tokens with role in payload
 *    - Returns user data without sensitive fields (no password)
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly auditService?: IAuditService,
  ) {}

  async execute(dto: LoginDTO): Promise<LoginResultDTO> {
    // Step 1: Find user by email
    const user = await this.userRepository.findByEmail(dto.email);

    // Step 2: Validate existence and password — generic error to prevent enumeration
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Guard: user registered via Google OAuth — has a random password they don't know
    if (user.authProvider === 'google') {
      throw new Error('Esta cuenta fue registrada con Google. Usa "Continuar con Google" para iniciar sesión.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Step 3: Verify account is active and verified
    if (!user.isActive) {
      throw new Error('Cuenta inactiva o no verificada');
    }

    // Rehash check (RSK-002): only for active users; uses BCRYPT_SALT_ROUNDS to match
    // the same env var used by Encryption.ts and docker-compose.yml
    const targetRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const currentRounds = bcrypt.getRounds(user.password);
    if (currentRounds !== targetRounds) {
      const newHash = await bcrypt.hash(dto.password, targetRounds);
      await this.userRepository.updatePassword(user.id, newHash);
    }

    if (user.mustChangePassword) {
      throw new Error('Cambio de contraseña obligatorio');
    }

    // Step 4: RF-17 — Update last login timestamp
    const now = new Date();
    await this.userRepository.updateLastLogin(user.id, now);

    // Step 5: RF-84 — Record audit log (optional, only if auditService is provided)
    if (this.auditService) {
      await this.auditService.record({
        userId: user.id,
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        details: { email: user.email, loginAt: now.toISOString() },
      });
    }

    // Step 6: Generate JWT tokens (dynamically resolving role according to RBAC HU-004)
    let userRole = 'CLIENT';
    if (user.roles && user.roles.length > 0) {
      const primaryRole = user.roles[0];
      if (primaryRole === 'SUPERADMIN') {
        userRole = 'ADMIN';
      } else if (primaryRole === 'SELLER') {
        userRole = 'SELLER';
      } else if (primaryRole === 'CLIENT') {
        userRole = 'CLIENT';
      } else {
        userRole = primaryRole;
      }
    }

    const tokens = this.jwtService.generateTokens({
      userId: user.id,
      email: user.email,
      role: userRole,
      branchId: user.branchId, // Included if the user is an employee
    });

    // Step 7: Return user data (without password) + tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        branchId: user.branchId, // Added for frontend context
        lastLogin: now,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }
}
