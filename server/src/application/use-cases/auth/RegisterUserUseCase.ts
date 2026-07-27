import { IUserRepository } from '@domain/repositories/IUserRepository';
import { RegisterUserDTO } from '@application/dtos/AuthDTO';
import { Encryption } from '@shared/utils/Encryption';
import { CodeGenerator } from '@shared/utils/CodeGenerator';
import { IEmailService } from '@domain/services/IEmailService';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(dto: RegisterUserDTO) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('Correo electrónico ya registrado');
    }

    const hashedPassword = await Encryption.hashPassword(dto.password);

    const newUser = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
    });

    const pin = CodeGenerator.generatePin();
    const expiresAt = new Date();
    const expirationHours = parseInt(
      process.env.VERIFICATION_PIN_EXPIRES_IN_HOURS || '24',
      10
    );
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    try {
      await this.userRepository.updateVerificationPin(
        newUser.id,
        pin,
        expiresAt
      );

      await this.emailService.sendEmail(
        newUser.email,
        'Tu código de verificación - E-Commerce',
        `<p>Hola,</p><p>Tu código de verificación es: <strong>${pin}</strong></p><p>Este código expira en ${expirationHours} horas.</p>`
      );
    } catch (error) {
      await this.userRepository.deleteById(newUser.id);
      throw new Error(
        'El registro falló porque no se pudo despachar el código de verificación. Por favor reintente.'
      );
    }

    return {
      id: newUser.id,
      email: newUser.email,
      isActive: newUser.isActive,
      message:
        'El usuario se ha creado correctamente. A la espera de verificación.',
    };
  }
}
