import { Request, Response } from 'express';
import { Profile } from 'passport-google-oauth20';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { VerifyUserUseCase } from '@application/use-cases/auth/VerifyUserUseCase';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '@application/use-cases/auth/ResetPasswordUseCase';
import { GoogleLoginUseCase } from '@application/use-cases/auth/GoogleLoginUseCase';
import {
  RegisterUserDTOSchema,
  VerifyUserDTOSchema,
  LoginDTOSchema,
  ForgotPasswordDTOSchema,
  ResetPasswordDTOSchema,
  RefreshTokenDTOSchema,
  GoogleProfileDTO,
} from '@application/dtos/AuthDTO';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { JwtService } from '@infrastructure/services/JwtService';

// Initialize dependencies
const userRepository = new PrismaUserRepository();
const emailService = new ResendEmailService();
const jwtService = new JwtService();
const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  emailService
);
const verifyUserUseCase = new VerifyUserUseCase(userRepository);
// Note: auditService will be wired once TT-001 AsyncLocalStorage middleware is integrated (HU-004)
const loginUseCase = new LoginUseCase(userRepository, jwtService);
const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepository,
  emailService,
  jwtService
);
const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  jwtService
);
const googleLoginUseCase = new GoogleLoginUseCase(userRepository, jwtService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, jwtService);

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = RegisterUserDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      // Execute Use Case
      const result = await registerUserUseCase.execute(validationResult.data);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Correo electrónico ya registrado') {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      console.error('[AuthController.register] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async verify(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = VerifyUserDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      // Execute Use Case
      await verifyUserUseCase.execute(validationResult.data);

      return res.status(200).json({
        success: true,
        message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.',
      });
    } catch (error: any) {
      if (error.message === 'La cuenta ya se encuentra verificada') {
        return res.status(409).json({ success: false, error: error.message });
      }

      if (
        error.message ===
          'El código de verificación ha expirado. Por favor, regístrese nuevamente.' ||
        error.message ===
          'No existe un código de verificación activo para esta cuenta'
      ) {
        return res.status(410).json({ success: false, error: error.message });
      }

      if (error.message === 'PIN inválido o expirado') {
        return res.status(400).json({ success: false, error: error.message });
      }

      console.error('[AuthController.verify] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = LoginDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      // Execute Use Case
      const result = await loginUseCase.execute(validationResult.data);

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error: any) {
      // Generic credential error → 401 (prevents email enumeration)
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({ success: false, error: error.message });
      }

      // Inactive/unverified account → 403
      if (error.message === 'Cuenta inactiva o no verificada') {
        return res.status(403).json({ success: false, error: error.message });
      }

      // Forced password change required on first login → 403
      if (error.message === 'Cambio de contraseña obligatorio') {
        return res.status(403).json({
          success: false,
          requirePasswordChange: true,
          error:
            'Se requiere un cambio de contraseña obligatorio en su primer inicio de sesión.',
        });
      }

      // OAuth-only account trying email/password login → 403
      if (error.message.includes('registrada con Google')) {
        return res.status(403).json({ success: false, error: error.message });
      }

      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = ForgotPasswordDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      // Execute Use Case — always resolves void (no info leaked about email existence)
      await forgotPasswordUseCase.execute(validationResult.data);

      // Always return 200 regardless of whether the email exists (prevents enumeration)
      return res.status(200).json({
        success: true,
        message:
          'Si el correo está registrado, recibirás un enlace de recuperación en breve.',
      });
    } catch (error: any) {
      console.error('[AuthController.forgotPassword] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      // Validate input (new password rules)
      const validationResult = ResetPasswordDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      // Execute Use Case
      await resetPasswordUseCase.execute(validationResult.data);

      return res.status(200).json({
        success: true,
        message: 'La contraseña ha sido restablecida con éxito.',
      });
    } catch (error: any) {
      // Token specific errors (JsonWebTokenError names)
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error:
            'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.',
        });
      }

      if (
        error.name === 'JsonWebTokenError' ||
        error.message === 'Token inválido' ||
        error.message ===
          'El enlace de recuperación ya fue utilizado o no es válido'
      ) {
        return res.status(401).json({
          success: false,
          error: 'El token de recuperación no es válido o ya fue utilizado.',
        });
      }

      if (error.message === 'Usuario no encontrado') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (
        error.message === 'La nueva contraseña no puede ser igual a la actual'
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      console.error('[AuthController.resetPassword] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * RSK-001 / T-043: Sliding-window token refresh.
   * Accepts a valid refresh token and returns a new access + refresh pair,
   * resetting the 7-day sliding window on every use.
   */
  async refresh(req: Request, res: Response) {
    try {
      const validationResult = RefreshTokenDTOSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.issues,
        });
      }

      const tokens = await refreshTokenUseCase.execute(
        validationResult.data.refreshToken
      );

      return res.status(200).json({
        success: true,
        data: { tokens },
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Sesión expirada: el refresh token ya no es válido',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token inválido',
        });
      }

      if (
        error.message === 'Cuenta inactiva' ||
        error.message === 'Usuario no encontrado'
      ) {
        return res.status(403).json({ success: false, error: error.message });
      }

      console.error('[AuthController.refresh] Error:', error);
      return res
        .status(500)
        .json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * HU-001 / T-033: Google OAuth callback handler.
   * Receives the Google profile from Passport, executes GoogleLoginUseCase,
   * sets JWT in httpOnly cookies, and redirects to frontend.
   */
  async googleCallback(req: Request, res: Response) {
    try {
      const profile = req.user as unknown as Profile;

      const googleProfile: GoogleProfileDTO = {
        googleId: profile.id,
        email: profile.emails?.[0]?.value ?? '',
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
      };

      const result = await googleLoginUseCase.execute(googleProfile);

      // Set JWT as httpOnly secure cookie
      res.cookie('auth_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      // Redirect to frontend success page
      return res.redirect(`${process.env.CORS_ORIGIN}/auth/google/success`);
    } catch (error: any) {
      console.error('[AuthController.googleCallback] Error:', error);
      return res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=oauth_failed`
      );
    }
  }

  /**
   * HU-001 / T-036: Session extraction from httpOnly cookie.
   * Reads the auth cookie, verifies the JWT, and returns the session data.
   * Clears the cookies after extraction (one-time use for frontend hydration).
   */
  async me(req: Request, res: Response) {
    try {
      const accessToken = req.cookies?.auth_token;
      const refreshToken = req.cookies?.refresh_token;

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: 'No hay sesión activa',
        });
      }

      // Verify the access token
      const payload = jwtService.verifyAccessToken(accessToken);

      // Clear the cookies after extraction (one-time transfer to localStorage)
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            branchId: payload.branchId,
          },
          tokens: {
            accessToken,
            refreshToken: refreshToken || '',
          },
        },
      });
    } catch (error: any) {
      // Clear invalid cookies
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });

      console.error('[AuthController.me] Error:', error);
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida o expirada',
      });
    }
  }
}
