import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@infrastructure/services/JwtService';
import prisma from '@infrastructure/database/prisma';
import { setContextUser } from '@infrastructure/context/RequestContext';

const jwtService = new JwtService();

/**
 * Factory function producing a reusable access-control middleware (HU-004 / T-039).
 * First validates JWT authentication integrity, and then cascades evaluation checking
 * dynamic User -> Role -> Permission associations directly against Prisma persistence.
 *
 * @param requiredPermission String uniquely identifying the required capability (e.g., "users:write")
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Extract Authorization Header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Token faltante o con formato incorrecto',
        });
      }

      const token = authHeader.split(' ')[1];

      // 2. Verify JWT (throws internal errors like TokenExpiredError or JsonWebTokenError if failing)
      const payload = jwtService.verifyAccessToken(token);

      // Attach security principal context using the standardized architecture property
      req.auth = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        branchId: payload.branchId,
      };
      setContextUser(payload.userId, payload.email);

      // 3. Fetch deep relational tree: User -> Roles -> Permissions
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado o sesión revocada',
        });
      }

      if (!dbUser.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: La cuenta se encuentra inactiva',
        });
      }

      // 4. Iterate aggregated permission matrices to solve RBAC challenge
      let hasRight = false;
      for (const role of dbUser.roles) {
        const matchingPermission = role.permissions.some(
          (permission: any) => permission.name === requiredPermission
        );
        if (matchingPermission) {
          hasRight = true;
          break;
        }
      }

      if (!hasRight) {
        return res.status(403).json({
          success: false,
          error: `Acceso denegado: Se requiere el permiso '${requiredPermission}'`,
        });
      }

      // Explicit allowed state achieved.
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Sesión expirada: Por favor, inicie sesión nuevamente',
        });
      }

      // General JWT manipulation or signature failures
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado: Token de autenticación inválido',
      });
    }
  };
};

/**
 * Generic authentication middleware.
 * Verifies JWT token integrity and attaches req.auth context without checking permission rules.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: Token faltante o con formato incorrecto',
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtService.verifyAccessToken(token);

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o sesión revocada',
      });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: La cuenta se encuentra inactiva',
      });
    }

    req.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    };
    setContextUser(payload.userId, payload.email);

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sesión expirada: Por favor, inicie sesión nuevamente',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Acceso denegado: Token de autenticación inválido',
    });
  }
};

/**
 * Optional authentication middleware.
 * If a valid JWT is provided, attaches req.auth context. Otherwise, continues without it.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwtService.verifyAccessToken(token);
    } catch (err) {
      // Si el token es inválido o expiró, simplemente lo ignoramos para el modo opcional
      return next();
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (dbUser && dbUser.isActive) {
      req.auth = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        branchId: payload.branchId,
      };
      setContextUser(payload.userId, payload.email);
    }

    next();
  } catch (error) {
    next();
  }
};
