import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Global Error Handler Middleware
 * Centralizes error handling for the entire application, specifically Prisma errors.
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[GlobalErrorHandler]:', err);

  // Handle Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint failed
        const target = (err.meta?.target as string[]) || [];
        return res.status(400).json({
          success: false,
          error: `Error de validación: El campo '${target.join(', ')}' ya existe y debe ser único.`,
          code: 'P2002',
        });
      }
      case 'P2025': {
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Recurso no encontrado: El registro solicitado no existe.',
          code: 'P2025',
        });
      }
      case 'P2003': {
        // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          error: 'Error de integridad: Referencia a un registro inexistente.',
          code: 'P2003',
        });
      }
      default:
        return res.status(500).json({
          success: false,
          error: `Error de base de datos (${err.code}): Por favor contacte al soporte.`,
          code: err.code,
        });
    }
  }

  // Handle Zod or Validation errors if passed through next(err)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación en los datos enviados',
      details: err.issues,
    });
  }

  // Default internal server error
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
};
