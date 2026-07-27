import { IUserRepository } from '@domain/repositories/IUserRepository';
import { JwtService, AuthTokens } from '@infrastructure/services/JwtService';

/**
 * RSK-001 / T-043: Sliding-window token renewal.
 * Verifies the incoming refresh token, fetches the user to confirm the
 * account is still active, and issues a brand-new access + refresh token
 * pair so the 7-day window resets on every authenticated interaction.
 *
 * The actual RBAC permission check is performed in each route via the
 * requirePermission middleware (DB query), not from the JWT role claim.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    // 1. Verify signature & expiry (throws on failure)
    const { userId } = this.jwtService.verifyRefreshToken(refreshToken);

    // 2. Confirm the user still exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new Error('Cuenta inactiva');
    }

    // Generate fresh pair — sliding window resets the 7-day TTL each use (dynamically resolving role according to RBAC HU-004)
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

    return this.jwtService.generateTokens({
      userId: user.id,
      email: user.email,
      role: userRole,
      branchId: user.branchId, // Included if the user is an employee
    });
  }
}
