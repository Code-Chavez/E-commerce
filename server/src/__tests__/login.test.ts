import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User } from '@domain/entities/User';
import { JwtService } from '@infrastructure/services/JwtService';

// ---- Mocks ----

const mockUserRepository: jest.Mocked<IUserRepository> = {
  findById: jest.fn<IUserRepository['findById']>(),
  findByEmail: jest.fn<IUserRepository['findByEmail']>(),
  findByGoogleId: jest.fn<IUserRepository['findByGoogleId']>(),
  create: jest.fn<IUserRepository['create']>(),
  updateLastLogin: jest.fn<IUserRepository['updateLastLogin']>(),
  updateVerificationPin: jest.fn<IUserRepository['updateVerificationPin']>(),
  deleteById: jest.fn<IUserRepository['deleteById']>(),
  activateUser: jest.fn<IUserRepository['activateUser']>(),
  updatePassword: jest.fn<IUserRepository['updatePassword']>(),
  updateGoogleId: jest.fn<IUserRepository['updateGoogleId']>(),
  updateStatus: jest.fn<IUserRepository['updateStatus']>(),
  updateProfile: jest.fn<IUserRepository['updateProfile']>(),
  findUsersByRoleName: jest.fn<IUserRepository['findUsersByRoleName']>(),
};

// Minimal JwtService stub for tests
const mockJwtService = {
  generateTokens: jest.fn<JwtService['generateTokens']>().mockReturnValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
} as unknown as JwtService;

const PLAIN_PASSWORD = 'Password1!';

// Build a real bcrypt hash at the given cost to simulate stored hashes
async function buildUser(overrides: Partial<User> & { saltRounds?: number } = {}): Promise<User> {
  const { saltRounds = 10, ...userOverrides } = overrides;
  const hash = await bcrypt.hash(PLAIN_PASSWORD, saltRounds);
  return {
    id: 1,
    email: 'test@dmendoza.com',
    name: 'Test User',
    password: hash,
    authProvider: 'local',
    lastLogin: null,
    isActive: true,
    verificationPin: null,
    pinExpiresAt: null,
    mustChangePassword: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    roles: ['CLIENT'],
    ...userOverrides,
  };
}

// ============================================================
// SUITE: LoginUseCase — rehash (RSK-002)
// ============================================================

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository.updateLastLogin.mockResolvedValue(undefined as any);
    loginUseCase = new LoginUseCase(mockUserRepository, mockJwtService);
  });

  afterEach(() => {
    delete process.env.BCRYPT_SALT_ROUNDS;
  });

  // ----------------------------------------------------------------
  // RSK-002 Test 1: Login exitoso — mismo costo → NO rehash
  // ----------------------------------------------------------------
  it('[RSK-002] no llama updatePassword cuando el costo del hash coincide con BCRYPT_SALT_ROUNDS', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '10';
    const user = await buildUser({ saltRounds: 10 });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockUserRepository.updatePassword.mockResolvedValue(undefined as any);

    await loginUseCase.execute({ email: user.email, password: PLAIN_PASSWORD });

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // RSK-002 Test 2: Login exitoso — costo distinto → SÍ rehash
  // ----------------------------------------------------------------
  it('[RSK-002] llama updatePassword con un hash nuevo cuando el costo difiere', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '12';
    // Hash almacenado con costo 10, target es 12
    const user = await buildUser({ saltRounds: 10 });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockUserRepository.updatePassword.mockResolvedValue(undefined as any);

    await loginUseCase.execute({ email: user.email, password: PLAIN_PASSWORD });

    expect(mockUserRepository.updatePassword).toHaveBeenCalledTimes(1);
    const [userId, newHash] = mockUserRepository.updatePassword.mock.calls[0];
    expect(userId).toBe(user.id);
    // El nuevo hash debe tener el costo 12
    expect(bcrypt.getRounds(newHash as string)).toBe(12);
  });

  // ----------------------------------------------------------------
  // Test 3: Contraseña incorrecta → no llega al rehash
  // ----------------------------------------------------------------
  it('lanza "Credenciales inválidas" con contraseña incorrecta y no rehashea', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '12';
    const user = await buildUser({ saltRounds: 10 });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    await expect(
      loginUseCase.execute({ email: user.email, password: 'WrongPassword!' }),
    ).rejects.toThrow('Credenciales inválidas');

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Test 4: Usuario inactivo → no rehashea (rehash es posterior al check isActive)
  // ----------------------------------------------------------------
  it('[RSK-002] no rehashea cuando la cuenta está inactiva', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '12';
    const user = await buildUser({ saltRounds: 10, isActive: false });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    await expect(
      loginUseCase.execute({ email: user.email, password: PLAIN_PASSWORD }),
    ).rejects.toThrow('Cuenta inactiva o no verificada');

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Test 5: Cuenta Google OAuth → lanza error específico antes del rehash
  // ----------------------------------------------------------------
  it('lanza error de OAuth para cuentas Google antes de cualquier rehash', async () => {
    const user = await buildUser({ authProvider: 'google' });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    await expect(
      loginUseCase.execute({ email: user.email, password: PLAIN_PASSWORD }),
    ).rejects.toThrow('Esta cuenta fue registrada con Google');

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });
});
