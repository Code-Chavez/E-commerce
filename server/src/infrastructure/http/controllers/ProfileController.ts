import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';
import { UpdateProfileUseCase } from '@application/use-cases/profile/UpdateProfileUseCase';
import { UpdateUserPreferencesUseCase } from '@application/use-cases/profile/UpdateUserPreferencesUseCase';

const userRepository = new PrismaUserRepository();
const storageService = new CloudinaryStorageService();
const updateProfileUseCase = new UpdateProfileUseCase(userRepository, storageService);
const updatePreferencesUseCase = new UpdateUserPreferencesUseCase();

// Validation Schema with strict E.164 phone format validation (HU-005)
const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres' })
    .optional(),
  lastName: z
    .string()
    .min(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    .max(50, { message: 'El apellido no puede exceder 50 caracteres' })
    .optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, {
      message: 'El número de teléfono debe estar en formato internacional E.164 (ej: +51999888777)',
    })
    .optional(),
  birthdate: z
    .string()
    .datetime({ message: 'La fecha de nacimiento debe ser una fecha ISO válida (ej: 1990-01-01T00:00:00Z)' })
    .optional(),
});

export class ProfileController {
  /**
   * HU-005: GET /api/v1/profile
   * Retrieves the authenticated client's profile details.
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName ?? null,
          phone: user.phone ?? null,
          avatarUrl: user.avatarUrl ?? null,
          birthdate: user.birthdate ?? null,
          authProvider: user.authProvider,
          preferencesJson: user.preferencesJson ?? null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * HU-005: PATCH /api/v1/profile
   * Updates client profile data (name, lastName, phone, and optional avatar image).
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      // 1. Zod Fields Validation
      const validation = UpdateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const { name, lastName, phone, birthdate } = validation.data;

      // 2. Extract Avatar File from Multer
      let avatarFile = undefined;
      if (req.file) {
        avatarFile = {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
        };
      }

      // 3. Execute Use Case
      const updatedProfile = await updateProfileUseCase.execute(userId, {
        name,
        lastName,
        phone,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        avatarFile,
      });

      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: updatedProfile,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * HU-080: PATCH /api/v1/profile/preferences
   * Updates client purchase preferences (sizes, favorite colors, etc.)
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const { preferencesJson } = req.body;
      if (!preferencesJson || typeof preferencesJson !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'El campo preferencesJson es requerido y debe ser un objeto',
        });
      }

      await updatePreferencesUseCase.execute(userId, preferencesJson);

      return res.status(200).json({
        success: true,
        message: 'Preferencias actualizadas correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

