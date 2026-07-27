import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IAuditService, AuditAction, AuditModule } from '@domain/services/AuditService';
import { JwtService } from '@infrastructure/services/JwtService';
import { User } from '@domain/entities/User';
import bcrypt from 'bcrypt';

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

const mockAuditService: jest.Mocked<IAuditService> = {
  record: jest.fn<IAuditService['record']>(),
  getAll: jest.fn<IAuditService['getAll']>(),
  getById: jest.fn<IAuditService['getById']>(),
};

// JwtService mock — avoids needing real JWT_SECRET env var in unit tests
const mockJwtService = {
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  }),
} as unknown as JwtService;

// ---- Test Suite ----

describe('LoginUseCase (HU-094)', () => {
  let loginUseCase: LoginUseCase;

  const hashedPassword = bcrypt.hashSync('Password123!', 10);

  const fakeUser: User = {
    id: 1,
    email: 'test@e-commerce.com',
    name: 'Test User',
    password: hashedPassword,
    authProvider: 'local',
    lastLogin: null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    loginUseCase = new LoginUseCase(mockUserRepository, mockJwtService, mockAuditService);
  });

  // ---- Success path ----

  it('should authenticate user and return tokens + user data on valid credentials', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockUserRepository.updateLastLogin.mockResolvedValue();
    mockAuditService.record.mockResolvedValue();

    const result = await loginUseCase.execute({
      email: 'test@e-commerce.com',
      password: 'Password123!',
    });

    expect(result.user.id).toBe(1);
    expect(result.user.email).toBe('test@e-commerce.com');
    expect(result.user.name).toBe('Test User');
    expect(result.user.lastLogin).toBeInstanceOf(Date);
    // Must NOT expose the password in the response
    expect((result.user as any).password).toBeUndefined();
    // Tokens must be present
    expect(result.tokens.accessToken).toBe('mock.access.token');
    expect(result.tokens.refreshToken).toBe('mock.refresh.token');
  });

  it('RF-17: should update lastLogin on every successful login', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockUserRepository.updateLastLogin.mockResolvedValue();
    mockAuditService.record.mockResolvedValue();

    await loginUseCase.execute({ email: 'test@e-commerce.com', password: 'Password123!' });

    expect(mockUserRepository.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(
      fakeUser.id,
      expect.any(Date),
    );
  });

  it('RF-84: should record an audit log entry on every successful login', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockUserRepository.updateLastLogin.mockResolvedValue();
    mockAuditService.record.mockResolvedValue();

    await loginUseCase.execute({ email: 'test@e-commerce.com', password: 'Password123!' });

    expect(mockAuditService.record).toHaveBeenCalledTimes(1);
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser.id,
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        details: expect.objectContaining({ email: fakeUser.email }),
      }),
    );
  });

  // ---- Error paths (HTTP 401) ----

  it('should throw generic error for non-existent email (prevents enumeration)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({ email: 'noexiste@e-commerce.com', password: 'Password123!' }),
    ).rejects.toThrow('Credenciales inválidas');

    expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    expect(mockAuditService.record).not.toHaveBeenCalled();
  });

  it('should throw generic error for wrong password (prevents enumeration)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);

    await expect(
      loginUseCase.execute({ email: 'test@e-commerce.com', password: 'WrongPassword!' }),
    ).rejects.toThrow('Credenciales inválidas');

    expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    expect(mockAuditService.record).not.toHaveBeenCalled();
  });

  // ---- Error path (HTTP 403) ----

  it('should throw inactive account error for unverified users', async () => {
    const inactiveUser: User = { ...fakeUser, isActive: false };
    mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

    await expect(
      loginUseCase.execute({ email: 'test@e-commerce.com', password: 'Password123!' }),
    ).rejects.toThrow('Cuenta inactiva o no verificada');

    expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    expect(mockAuditService.record).not.toHaveBeenCalled();
  });

  // ---- Audit isolation ----

  it('should not record audit or update lastLogin if login fails', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({ email: 'noexiste@e-commerce.com', password: 'x' }),
    ).rejects.toThrow();

    expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    expect(mockAuditService.record).not.toHaveBeenCalled();
  });
});


