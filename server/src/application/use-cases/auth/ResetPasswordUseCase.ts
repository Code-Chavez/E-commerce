import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ResetPasswordDTO } from '@application/dtos/AuthDTO';
import { JwtService } from '@infrastructure/services/JwtService';
import bcrypt from 'bcrypt';

/**
 * Application Use Case: Reset Password (HU-003 / T-028).
 * Receives a JWT reset token and new raw password.
 * Validates the token, hashes the password, and persists the change.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    // 1. Verify the token validity and expiration
    // Throws automatic jsonwebtoken error if invalid or expired
    const payload = this.jwtService.verifyPasswordResetToken(dto.token);

    // 2. Double check if the user still exists
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2.5 Security Rule: check if the token has already been used by comparing the hash fragment
    if (payload.hashFragment && payload.hashFragment !== user.password.slice(-10)) {
      throw new Error('El enlace de recuperación ya fue utilizado o no es válido');
    }

    // 3. Security Rule: verify new password is not identical to current one
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new Error('La nueva contraseña no puede ser igual a la actual');
    }

    // 4. Hash new password (BCrypt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    // 4. Save explicitly into DB via repo
    await this.userRepository.updatePassword(user.id, hashedPassword);
  }
}
