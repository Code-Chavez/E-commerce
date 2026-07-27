import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { GoogleProfileDTO } from '@application/dtos/AuthDTO';
import { UserResponseDTO } from '@application/dtos/user.dto';
import { JwtService, AuthTokens } from '@infrastructure/services/JwtService';

export interface GoogleLoginResultDTO {
  user: UserResponseDTO;
  tokens: AuthTokens;
}

/**
 * Application Use Case: Google OAuth Login (HU-001 / T-033).
 *
 * Business rules enforced:
 * 1. Search user by googleId in the database.
 * 2. If not found, search by email (possible prior email/password registration).
 *    - If email exists but no googleId → link googleId to existing user.
 *    - If not found → create new user with:
 *      • isActive = true (Google already verified the email)
 *      • authProvider = "google"
 *      • password = bcrypt.hash(crypto.randomUUID()) — random secure password
 * 3. Update lastLogin timestamp.
 * 4. Generate system JWT tokens (not Google's tokens).
 * 5. Return user data + tokens.
 */
export class GoogleLoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: GoogleProfileDTO): Promise<GoogleLoginResultDTO> {
    // Step 1: Search by Google ID
    let user = await this.userRepository.findByGoogleId(dto.googleId);

    if (!user) {
      // Step 2: Search by email (possible existing account)
      const existingUser = await this.userRepository.findByEmail(dto.email);

      if (existingUser) {
        // Link Google ID to existing user
        await this.userRepository.updateGoogleId(
          existingUser.id,
          dto.googleId,
          dto.avatarUrl,
        );
        user = { ...existingUser, googleId: dto.googleId, authProvider: 'google' };
      } else {
        // Step 3: Create new user with random password
        const randomPassword = crypto.randomUUID();
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
        const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

        user = await this.userRepository.create({
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          googleId: dto.googleId,
          avatarUrl: dto.avatarUrl,
          authProvider: 'google',
        });

        // Google already verified the email, so activate immediately
        await this.userRepository.activateUser(user.id);
        user = { ...user, isActive: true };
      }
    }

    // Step 4: Update lastLogin
    const now = new Date();
    await this.userRepository.updateLastLogin(user.id, now);

    // Step 5: Generate system JWT tokens (dynamically resolving role according to RBAC HU-004)
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

    // Step 6: Return user data (without password) + tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastLogin: now,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }
}
