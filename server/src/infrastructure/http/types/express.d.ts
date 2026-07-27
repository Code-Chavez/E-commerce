import { AuthContext } from '@domain/entities/AuthContext';

/**
 * Infrastructure Layer: Express Request Extension
 * Centrally extends the Request object to include security context.
 * Uses a dedicated 'auth' property to prevent naming collisions with Passport.js.
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      rawBody?: Buffer;
    }
  }
}

export {};
