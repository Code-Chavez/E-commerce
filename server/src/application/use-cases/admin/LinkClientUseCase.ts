import { IClientRepository } from '@domain/repositories/IClientRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IRoleRepository } from '@domain/repositories/IRoleRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { ITransactionManager } from '@domain/repositories/ITransactionManager';
import { Encryption } from '@shared/utils/Encryption';
import { JwtService } from '@infrastructure/services/JwtService';
import crypto from 'crypto';

export class LinkClientUseCase {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly emailService: IEmailService,
    private readonly transactionManager: ITransactionManager,
    private readonly jwtService: JwtService
  ) {}

  async execute(clientId: number, email?: string): Promise<{ success: boolean; message: string }> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    if (client.userId) {
      throw new Error('El cliente ya tiene una cuenta vinculada');
    }

    // Use provided email if client has none
    const clientEmail = client.email || email?.trim() || null;

    if (!clientEmail) {
      throw new Error('El cliente debe tener un correo electrónico registrado para poder vincular su cuenta');
    }

    // If the client had no email, persist the provided one before linking
    if (!client.email && email?.trim()) {
      await this.clientRepository.update(client.id, { email: clientEmail });
    }

    // Verificar si el email ya existe en User (por si acaso no está vinculado pero existe)
    const existingUser = await this.userRepository.findByEmail(clientEmail);
    if (existingUser) {
      // Si el usuario existe pero no está vinculado al cliente, lo vinculamos en una transacción
      await this.transactionManager.run(async (tx) => {
        await this.clientRepository.linkUser(client.id, existingUser.id, tx);
      });
      return { success: true, message: 'Cliente vinculado a cuenta existente' };
    }

    // Crear cuenta nueva con contraseña temporal que cumpla con los requisitos (mayúscula y número)
    const tempPassword = 'A1' + crypto.randomBytes(6).toString('hex');
    const hashedPassword = await Encryption.hashPassword(tempPassword);
    let newUserId = 0;

    await this.transactionManager.run(async (tx) => {
      const newUser = await this.userRepository.create({
        email: clientEmail,
        name: client.name,
        password: hashedPassword,
        isActive: true, // Activamos la cuenta directamente
        authProvider: 'local',
        mustChangePassword: true // Forzado de cambio en primer inicio
      }, tx);
      newUserId = newUser.id;

      // Asignar rol CLIENT
      const clientRole = await this.roleRepository.findByName('CLIENT');
      if (clientRole) {
        await this.roleRepository.assignRoleToUser(newUser.id, clientRole.id, tx);
      }

      // Vincular cliente con usuario
      await this.clientRepository.linkUser(client.id, newUser.id, tx);
    });

    // Enviar credenciales vía Email (fuera de la transacción de BD).
    // Wrapped in try-catch so a transient email failure does NOT roll back the
    // already-committed DB transaction. The admin will be notified of partial
    // success and can manually trigger a credential re-send if needed.
    try {
      const resetToken = this.jwtService.generateWelcomePasswordToken(newUserId, clientEmail, hashedPassword);
      const clientUrl = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
      const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

      const subject = 'Bienvenido a D\'Mendoza — Activación de cuenta';
      const html = `
        <!DOCTYPE html>
        <html lang="es">
          <head><meta charset="UTF-8" /></head>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px;">
            <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
              <h2 style="color: #1a1a2e; margin-bottom: 8px;">¡Bienvenido Omnicanal a D'Mendoza!</h2>
              <p style="color: #555; font-size: 15px; line-height: 1.6;">
                Tu cuenta física ha sido vinculada exitosamente con nuestra plataforma de E-commerce.
              </p>
              <p style="color: #555; font-size: 15px; line-height: 1.6;">
                Para tu seguridad, hemos generado una contraseña temporal y requerimos que la cambies en tu primer inicio de sesión:
              </p>
              <ul style="color: #555; font-size: 14px;">
                <li><strong>Email:</strong> ${clientEmail}</li>
                <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
              </ul>
              <p style="color: #555; font-size: 14px;">
                Puedes usar el enlace seguro a continuación para configurar tu nueva contraseña directamente:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}"
                   style="background-color: #1a1a2e; color: #fff; padding: 14px 28px;
                          border-radius: 6px; text-decoration: none; font-size: 15px;
                          font-weight: bold; display: inline-block;">
                  Establecer mi Contraseña
                </a>
              </div>
              <p style="color: #aaa; font-size: 12px; text-align: center;">
                Este enlace de un solo uso es válido por 48 horas. Si expira, puedes usar la opción "Olvidé mi contraseña" en la web.
              </p>
            </div>
          </body>
        </html>
      `;

      await this.emailService.sendEmail(clientEmail, subject, html);
    } catch (emailError: any) {
      // Log the warning but do NOT rethrow — the account is already linked.
      // The administrator can trigger a credential re-send from a future endpoint.
      console.warn(
        `[LinkClientUseCase] Account linked for client ${client.id} but email delivery failed:`,
        emailError?.message ?? emailError
      );
      return {
        success: true,
        message: 'Cliente vinculado. Advertencia: no se pudo enviar el correo de credenciales.',
      };
    }

    return { success: true, message: 'Cliente vinculado y credenciales enviadas' };
  }
}
