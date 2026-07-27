import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GoogleLoginUseCase } from '@application/use-cases/auth/GoogleLoginUseCase';
import { GoogleProfileDTO } from '@application/dtos/AuthDTO';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User, CreateUserDTO } from '@domain/entities/User';
import { JwtService } from '@infrastructure/services/JwtService';

/**
 * T-034: Unit tests for GoogleLoginUseCase.
 *
 * Tests:
 * 1. Should create a new user when Google profile is new.
 * 2. Should link googleId when email exists without googleId.
 * 3. Should return system JWT (not Google's token).
 * 4. Should update lastLogin timestamp.
 * 5. Should set authProvider to "google" for new users.
 * 6. Should generate a random bcrypt password for new Google users.
 * 7. Should reuse existing user when googleId already exists.
 * 8. Should activate new Google user immediately.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGoogleProfile: GoogleProfileDTO = {
  googleId: 'google-123456789',
  email: 'testuser@gmail.com',
  name: 'Test User',
  avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
};

const mockExistingUser: User = {
  id: 1,
  email: 'testuser@gmail.com',
  name: 'Test User',
  password: '$2b$12$hashedPasswordHere',
  googleId: null,
  avatarUrl: null,
  authProvider: 'local',
  lastLogin: null,
  isActive: true,
  verificationPin: null,
  pinExpiresAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockGoogleUser: User = {
  id: 2,
  email: 'googleonly@gmail.com',
  name: 'Google User',
  password: '$2b$12$randomHashedPassword',
  googleId: 'google-987654321',
  avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
  authProvider: 'google',
  lastLogin: new Date('2026-05-01'),
  isActive: true,
  verificationPin: null,
  pinExpiresAt: null,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
};

const mockTokens = {
  accessToken: 'mock-access-token-jwt',
  refreshToken: 'mock-refresh-token-jwt',
};

// Factory for mock repository
const createMockRepository = (overrides: Partial<IUserRepository> = {}): IUserRepository => ({
  findById: jest.fn<IUserRepository['findById']>().mockResolvedValue(null),
  findByEmail: jest.fn<IUserRepository['findByEmail']>().mockResolvedValue(null),
  findByGoogleId: jest.fn<IUserRepository['findByGoogleId']>().mockResolvedValue(null),
  create: jest.fn<IUserRepository['create']>().mockImplementation(async (data) => ({
    id: 99,
    email: data.email,
    name: data.name ?? null,
    password: data.password,
    googleId: data.googleId ?? null,
    avatarUrl: data.avatarUrl ?? null,
    authProvider: data.authProvider ?? 'local',
    lastLogin: null,
    isActive: false,
    verificationPin: null,
    pinExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateLastLogin: jest.fn<IUserRepository['updateLastLogin']>().mockResolvedValue(undefined),
  updateVerificationPin: jest.fn<IUserRepository['updateVerificationPin']>().mockResolvedValue(undefined),
  deleteById: jest.fn<IUserRepository['deleteById']>().mockResolvedValue(undefined),
  activateUser: jest.fn<IUserRepository['activateUser']>().mockResolvedValue(undefined),
  updatePassword: jest.fn<IUserRepository['updatePassword']>().mockResolvedValue(undefined),
  updateGoogleId: jest.fn<IUserRepository['updateGoogleId']>().mockResolvedValue(undefined),
  updateStatus: jest.fn<IUserRepository['updateStatus']>().mockResolvedValue(undefined),
  updateProfile: jest.fn<IUserRepository['updateProfile']>().mockImplementation(async (userId) => ({
    id: userId,
    email: 'mock@domain.com',
    name: 'Mock',
    lastName: 'User',
    phone: '+51999999999',
    password: '',
    googleId: null,
    avatarUrl: null,
    authProvider: 'local',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  findUsersByRoleName: jest.fn<IUserRepository['findUsersByRoleName']>().mockResolvedValue([]),
  ...overrides,
});

// Mock JwtService
const createMockJwtService = (): JwtService => {
  const service = Object.create(JwtService.prototype);
  service.generateTokens = jest.fn().mockReturnValue(mockTokens);
  service.verifyAccessToken = jest.fn();
  service.verifyRefreshToken = jest.fn();
  return service;
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GoogleLoginUseCase (HU-001 / T-034)', () => {
  let mockRepo: IUserRepository;
  let mockJwt: JwtService;
  let useCase: GoogleLoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepository();
    mockJwt = createMockJwtService();
    useCase = new GoogleLoginUseCase(mockRepo, mockJwt);
  });

  // ─── Test 1: New user creation ─────────────────────────────────────────

  it('should create a new user when Google profile is completely new', async () => {
    const result = await useCase.execute(mockGoogleProfile);

    // Verify user was created
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    const createCall = (mockRepo.create as jest.Mock).mock.calls[0][0] as CreateUserDTO;
    expect(createCall.email).toBe(mockGoogleProfile.email);
    expect(createCall.name).toBe(mockGoogleProfile.name);
    expect(createCall.googleId).toBe(mockGoogleProfile.googleId);
    expect(createCall.authProvider).toBe('google');

    // Verify tokens returned
    expect(result.tokens).toEqual(mockTokens);
    expect(result.user.email).toBe(mockGoogleProfile.email);
  });

  // ─── Test 2: Link googleId to existing email user ──────────────────────

  it('should link googleId when email exists without googleId', async () => {
    mockRepo = createMockRepository({
      findByGoogleId: jest.fn<IUserRepository['findByGoogleId']>().mockResolvedValue(null),
      findByEmail: jest.fn<IUserRepository['findByEmail']>().mockResolvedValue(mockExistingUser),
    });
    useCase = new GoogleLoginUseCase(mockRepo, mockJwt);

    const result = await useCase.execute(mockGoogleProfile);

    // Should NOT create a new user
    expect(mockRepo.create).not.toHaveBeenCalled();

    // Should link the Google ID
    expect(mockRepo.updateGoogleId).toHaveBeenCalledWith(
      mockExistingUser.id,
      mockGoogleProfile.googleId,
      mockGoogleProfile.avatarUrl,
    );

    expect(result.user.id).toBe(mockExistingUser.id);
    expect(result.tokens).toEqual(mockTokens);
  });

  // ─── Test 3: Return system JWT (not Google's) ──────────────────────────

  it('should return system JWT tokens, not Google tokens', async () => {
    const result = await useCase.execute(mockGoogleProfile);

    expect(mockJwt.generateTokens).toHaveBeenCalledWith({
      userId: expect.any(Number),
      email: mockGoogleProfile.email,
      role: 'CLIENT',
    });

    expect(result.tokens.accessToken).toBe('mock-access-token-jwt');
    expect(result.tokens.refreshToken).toBe('mock-refresh-token-jwt');
  });

  // ─── Test 4: Update lastLogin ──────────────────────────────────────────

  it('should update lastLogin timestamp on successful login', async () => {
    await useCase.execute(mockGoogleProfile);

    expect(mockRepo.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateLastLogin).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Date),
    );
  });

  // ─── Test 5: authProvider set to "google" ──────────────────────────────

  it('should set authProvider to "google" for new users', async () => {
    await useCase.execute(mockGoogleProfile);

    const createCall = (mockRepo.create as jest.Mock).mock.calls[0][0] as CreateUserDTO;
    expect(createCall.authProvider).toBe('google');
  });

  // ─── Test 6: Random bcrypt password for new Google users ───────────────

  it('should generate a random bcrypt-hashed password for new Google users', async () => {
    await useCase.execute(mockGoogleProfile);

    const createCall = (mockRepo.create as jest.Mock).mock.calls[0][0] as CreateUserDTO;
    // Password should be a bcrypt hash (starts with $2b$)
    expect(createCall.password).toMatch(/^\$2[aby]\$/);
    // Password should NOT be empty
    expect(createCall.password.length).toBeGreaterThan(50);
  });

  // ─── Test 7: Reuse existing Google user ────────────────────────────────

  it('should reuse existing user when googleId already exists in DB', async () => {
    const existingGoogleProfile: GoogleProfileDTO = {
      googleId: mockGoogleUser.googleId!,
      email: mockGoogleUser.email,
      name: mockGoogleUser.name!,
      avatarUrl: mockGoogleUser.avatarUrl ?? undefined,
    };

    mockRepo = createMockRepository({
      findByGoogleId: jest.fn<IUserRepository['findByGoogleId']>().mockResolvedValue(mockGoogleUser),
    });
    useCase = new GoogleLoginUseCase(mockRepo, mockJwt);

    const result = await useCase.execute(existingGoogleProfile);

    // Should NOT create or update — just reuse
    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.updateGoogleId).not.toHaveBeenCalled();

    // Should still update lastLogin and generate tokens
    expect(mockRepo.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(result.user.id).toBe(mockGoogleUser.id);
    expect(result.tokens).toEqual(mockTokens);
  });

  // ─── Test 8: Activate new Google user immediately ──────────────────────

  it('should activate new Google user immediately (Google verifies email)', async () => {
    await useCase.execute(mockGoogleProfile);

    expect(mockRepo.activateUser).toHaveBeenCalledTimes(1);
    expect(mockRepo.activateUser).toHaveBeenCalledWith(99); // created user id
  });
});


