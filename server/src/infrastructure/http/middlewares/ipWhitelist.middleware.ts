import { Request, Response, NextFunction } from 'express';
import prisma from '@infrastructure/database/prisma';
import { JwtService } from '@infrastructure/services/JwtService';

const jwtService = new JwtService();

/**
 * RSK-003 / T-046 + T-047: IP whitelist middleware with audit logging.
 *
 * Reads IP_WHITELIST env var (comma-separated). If the request's source IP
 * is not on the list, it:
 *   1. Logs the blocked attempt to AuditLog (T-047) with ip, route,
 *      timestamp, and userId extracted from the JWT (if present).
 *   2. Returns HTTP 403 { success: false } (T-046).
 *
 * If IP_WHITELIST is empty the middleware is a no-op (dev/open mode).
 */
export const ipWhitelist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const whitelistEnv = process.env.IP_WHITELIST ?? '';

  if (!whitelistEnv.trim()) {
    next();
    return;
  }

  const allowedIps = whitelistEnv
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  const raw = req.ip ?? req.socket.remoteAddress ?? '';
  const clientIp = raw.replace(/^::ffff:/, '');

  if (allowedIps.includes(clientIp)) {
    next();
    return;
  }

  // --- Blocked: extract userId from JWT for audit record if token is present ---
  let userId: number | undefined;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = jwtService.verifyAccessToken(token);
      userId = payload.userId;
    }
  } catch {
    // Token absent or invalid — audit without userId
  }

  // T-047: Persist blocked-IP attempt to AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        action: 'BLOCKED_IP',
        module: 'SECURITY',
        details: {
          ip: clientIp,
          route: req.originalUrl,
          timestamp: new Date().toISOString(),
        },
        userId: userId ?? null,
      },
    });
  } catch {
    // Audit failure must not break the security response
  }

  res.status(403).json({
    success: false,
    error: 'Acceso denegado: IP no autorizada',
  });
};
