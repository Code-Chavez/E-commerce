import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  branchId?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Infrastructure Service: JWT token generation and verification.
 * - Access Token: 15 minutes (short-lived, for API authorization)
 * - Refresh Token: 7 days (long-lived, for token renewal)
 */
export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor() {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      if (process.env.NODE_ENV === 'test') {
        // Provide dummy secrets for tests to avoid crashing the app on boot
        this.accessSecret = 'test_access_secret';
        this.refreshSecret = 'test_refresh_secret';
        return;
      }

      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables',
      );
    }

    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

  /**
   * Generates both access and refresh tokens for an authenticated user.
   */
  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId: payload.userId }, this.refreshSecret, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verifies an access token and returns its decoded payload.
   * Throws if the token is invalid or expired.
   */
  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecret) as TokenPayload;
  }

  /**
   * Verifies a refresh token and returns the userId from its payload.
   * Throws if the token is invalid or expired.
   */
  verifyRefreshToken(token: string): { userId: number } {
    return jwt.verify(token, this.refreshSecret) as { userId: number };
  }

  /**
   * HU-003: Generates a short-lived password reset token (1h).
   * Payload includes userId, email, and a fragment of the current password hash
   * for server-side validation (to ensure single-use).
   * Signed with JWT_SECRET to ensure it cannot be forged.
   */
  generatePasswordResetToken(userId: number, email: string, currentPasswordHash: string): string {
    const expiresIn = process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN || '1h';
    // Use the last 10 characters of the hash as a simple stateless invalidation check
    const hashFragment = currentPasswordHash.slice(-10);

    return jwt.sign(
      { userId, email, purpose: 'password-reset', hashFragment },
      this.accessSecret,
      { expiresIn: expiresIn as any },
    );
  }

  /**
   * HU-008: Generates a 48h password reset token specifically for new linked accounts.
   */
  generateWelcomePasswordToken(userId: number, email: string, currentPasswordHash: string): string {
    const hashFragment = currentPasswordHash.slice(-10);

    return jwt.sign(
      { userId, email, purpose: 'welcome-password', hashFragment },
      this.accessSecret,
      { expiresIn: '48h' },
    );
  }

  /**
   * HU-003 / HU-008: Verifies a password reset or welcome token.
   * Returns the decoded payload or throws if expired / invalid.
   */
  verifyPasswordResetToken(token: string): { userId: number; email: string; purpose: string; hashFragment?: string } {
    const payload = jwt.verify(token, this.accessSecret) as {
      userId: number;
      email: string;
      purpose: string;
      hashFragment?: string;
    };

    if (payload.purpose !== 'password-reset' && payload.purpose !== 'welcome-password') {
      throw new Error('Token inválido');
    }

    return payload;
  }
}
