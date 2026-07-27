import { JwtService } from '../infrastructure/services/JwtService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Welcome Token (HU-008)', () => {
  let jwtService: JwtService;

  beforeAll(() => {
    // Setup environment variables for test
    process.env.JWT_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN = '1h'; // default reset token
    jwtService = new JwtService();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  it('should generate a welcome-password token valid for 48h', async () => {
    const userId = 1;
    const email = 'test@example.com';
    const passwordHash = await bcrypt.hash('temp_password', 10);

    const token = jwtService.generateWelcomePasswordToken(
      userId,
      email,
      passwordHash
    );

    // Decode without verifying to check the payload
    const decoded = jwt.decode(token) as any;

    expect(decoded.purpose).toBe('welcome-password');
    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.hashFragment).toBe(passwordHash.slice(-10));

    // Check expiration difference is approx 48h (in seconds)
    const diffInHours = (decoded.exp - decoded.iat) / 3600;
    expect(diffInHours).toBe(48);
  });

  it('should verify a valid welcome-password token', async () => {
    const userId = 2;
    const email = 'client@example.com';
    const passwordHash = await bcrypt.hash('secret', 10);

    const token = jwtService.generateWelcomePasswordToken(
      userId,
      email,
      passwordHash
    );
    const verified = jwtService.verifyPasswordResetToken(token); // dual validator

    expect(verified.purpose).toBe('welcome-password');
    expect(verified.userId).toBe(userId);
    expect(verified.email).toBe(email);
    expect(verified.hashFragment).toBe(passwordHash.slice(-10));
  });

  it('should reject a token with an invalid purpose', () => {
    const token = jwt.sign(
      { userId: 3, email: 'hacker@example.com', purpose: 'access' },
      'test_access_secret',
      { expiresIn: '15m' }
    );

    expect(() => {
      jwtService.verifyPasswordResetToken(token);
    }).toThrow('Token inválido');
  });
});
