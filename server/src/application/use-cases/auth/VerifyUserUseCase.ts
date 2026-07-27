import { IUserRepository } from '@domain/repositories/IUserRepository';
import { VerifyUserDTO } from '@application/dtos/AuthDTO';

/**
 * Caso de uso: Verificación de cuenta por PIN.
 * RF-03 / T-017: Valida el PIN de 6 dígitos enviado al correo y activa la cuenta del usuario.
 */
export class VerifyUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: VerifyUserDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      // Respuesta genérica para no revelar si el email existe o no (seguridad)
      throw new Error('PIN inválido o expirado');
    }

    if (user.isActive) {
      throw new Error('La cuenta ya se encuentra verificada');
    }

    if (!user.verificationPin || !user.pinExpiresAt) {
      throw new Error('No existe un código de verificación activo para esta cuenta');
    }

    // Verificar expiración
    if (new Date() > user.pinExpiresAt) {
      throw new Error('El código de verificación ha expirado. Por favor, regístrese nuevamente.');
    }

    // Verificar coincidencia del PIN
    if (dto.pin !== user.verificationPin) {
      throw new Error('PIN inválido o expirado');
    }

    // Activar usuario y limpiar PIN
    await this.userRepository.activateUser(user.id);
  }
}
