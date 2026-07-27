import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import prisma from '@infrastructure/database/prisma';

const userRepository = new PrismaUserRepository();

const UpdateStatusSchema = z.object({
  isActive: z.boolean(),
});

export class UserController {
  /**
   * HU-009 / T-050: PATCH /api/v1/users/:id/status
   * Activates or deactivates a user account. Requires users:write permission
   * (enforced by requirePermission middleware in the route definition).
   * Registers the action in AuditLog for traceability.
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    // requirePermission sets req.user as { id, email, role } — cast to access it
    const adminUser = req.user as { id: number; email: string; role: string } | undefined;

    try {
      const targetId = parseInt(String(req.params.id), 10);
      if (isNaN(targetId)) {
        return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
      }

      const validation = UpdateStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }

      const { isActive } = validation.data;

      // Verify the target user exists
      const target = await userRepository.findById(targetId);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      // Prevent admin from disabling their own account
      if (adminUser?.id === targetId && !isActive) {
        return res.status(400).json({
          success: false,
          error: 'No puedes desactivar tu propia cuenta',
        });
      }

      await userRepository.updateStatus(targetId, isActive);

      // Audit log — RF-84
      await prisma.auditLog.create({
        data: {
          action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
          module: 'USERS',
          details: {
            targetUserId: targetId,
            targetEmail: target.email,
            isActive,
          },
          userId: adminUser?.id ?? null,
        },
      });

      return res.status(200).json({
        success: true,
        data: { userId: targetId, isActive },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
