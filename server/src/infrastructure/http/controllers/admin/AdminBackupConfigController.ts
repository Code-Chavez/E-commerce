import { Request, Response } from 'express';
import { GetBackupConfigUseCase } from '@application/use-cases/backup/GetBackupConfigUseCase';
import { UpdateBackupConfigUseCase } from '@application/use-cases/backup/UpdateBackupConfigUseCase';
import { PrismaBackupConfigRepository } from '@infrastructure/database/repositories/PrismaBackupConfigRepository';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';

export class AdminBackupConfigController {
  private readonly getUseCase: GetBackupConfigUseCase;
  private readonly updateUseCase: UpdateBackupConfigUseCase;
  private readonly emailService: ResendEmailService;

  constructor() {
    const repo = new PrismaBackupConfigRepository();
    this.getUseCase = new GetBackupConfigUseCase(repo);
    this.updateUseCase = new UpdateBackupConfigUseCase(repo);
    this.emailService = new ResendEmailService();
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    const role = req.auth?.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador.',
      });
      return;
    }
    try {
      const config = await this.getUseCase.execute();
      res.status(200).json({ success: true, data: config });
    } catch {
      res.status(500).json({
        success: false,
        error: 'Error interno al obtener configuración de backup',
      });
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    const role = req.auth?.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador.',
      });
      return;
    }
    try {
      const { retentionDays, adminEmail, cronExpression } = req.body;
      const config = await this.updateUseCase.execute({
        retentionDays,
        adminEmail,
        cronExpression,
      });
      res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      if (error.message?.includes('mayor a 0')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error interno al actualizar configuración de backup',
      });
    }
  }

  async notifyFailure(req: Request, res: Response): Promise<void> {
    const secret = req.headers['x-backup-secret'];
    if (!secret || secret !== process.env.BACKUP_WEBHOOK_SECRET) {
      res
        .status(401)
        .json({ success: false, error: 'Secreto de backup inválido' });
      return;
    }
    try {
      const { database, host, date } = req.body;
      const config = await this.getUseCase.execute();
      const subject = '[ALERTA] Fallo de Backup E-Commerce';
      const html = `
        <h2>Fallo en el respaldo de base de datos</h2>
        <p><strong>Base de datos:</strong> ${database}</p>
        <p><strong>Host:</strong> ${host}</p>
        <p><strong>Fecha:</strong> ${date}</p>
        <p>Revise el estado del contenedor <code>db_backup_service</code> para más detalles.</p>
      `;
      await this.emailService.sendEmail(config.adminEmail, subject, html);
      res.status(200).json({ success: true, message: 'Notificación enviada' });
    } catch {
      res.status(500).json({
        success: false,
        error: 'Error interno al enviar notificación de backup',
      });
    }
  }
}
