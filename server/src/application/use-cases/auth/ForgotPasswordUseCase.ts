import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { ForgotPasswordDTO } from '@application/dtos/AuthDTO';
import { JwtService } from '@infrastructure/services/JwtService';

/**
 * Application Use Case: Forgot Password — request a reset link (HU-003 / T-027).
 *
 * Business rules enforced:
 * 1. Email format is validated upstream by the controller (Zod).
 * 2. Whether or not the email exists in the database, we ALWAYS return a
 *    generic success response to prevent email enumeration attacks.
 * 3. If the user exists AND is active, we:
 *    a. Generate a short-lived JWT reset token (15 min, purpose: 'password-reset').
 *    b. Send the link to the registered email via IEmailService.
 * 4. If the user does not exist or is inactive, we silently do nothing
 *    (the controller still returns HTTP 200 with success: true).
 */
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: ForgotPasswordDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    // Silent exit: do not reveal whether the email exists
    if (!user || !user.isActive) {
      return;
    }

    // Generate a tamper-proof reset token valid for 1 hour
    const resetToken = this.jwtService.generatePasswordResetToken(user.id, user.email, user.password);

    // Build the reset URL pointing to the frontend reset-password page
    const clientUrl = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // Compose and send the email
    const subject = 'Recuperación de contraseña — D\'Mendoza';
    const html = this.buildEmailHtml(resetLink);

    await this.emailService.sendEmail(user.email, subject, html);
  }

  /**
   * Builds the HTML body for the password reset email.
   * Provides a clean, branded message with a single CTA button.
   */
  private buildEmailHtml(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Recuperación de contraseña</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en
              <strong>D'Mendoza</strong>. Haz clic en el botón a continuación para continuar.
            </p>
            <p style="color: #888; font-size: 13px;">
              Este enlace es válido únicamente por <strong>1 hora</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="background-color: #e63946; color: #fff; padding: 14px 28px;
                        border-radius: 6px; text-decoration: none; font-size: 15px;
                        font-weight: bold; display: inline-block;">
                Restablecer contraseña
              </a>
            </div>
            <p style="color: #aaa; font-size: 12px; text-align: center;">
              Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
