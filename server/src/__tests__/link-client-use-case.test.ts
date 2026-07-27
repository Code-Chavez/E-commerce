import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LinkClientUseCase } from '@application/use-cases/admin/LinkClientUseCase';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IRoleRepository } from '@domain/repositories/IRoleRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { ITransactionManager } from '@domain/repositories/ITransactionManager';
import { Client } from '@domain/entities/Client';
import { User } from '@domain/entities/User';
import { Role } from '@domain/entities/Role';

// ---------------------------------------------------------------------------
// Mock factories — typed against domain interfaces for maximum safety
// ---------------------------------------------------------------------------

const makeMockClientRepository = (): jest.Mocked<IClientRepository> => ({
  findById: jest.fn<IClientRepository['findById']>(),
  findByEmail: jest.fn<IClientRepository['findByEmail']>(),
  findAllWithoutUser: jest.fn<IClientRepository['findAllWithoutUser']>(),
  create: jest.fn<IClientRepository['create']>(),
  linkUser: jest.fn<IClientRepository['linkUser']>(),
  search: jest.fn<IClientRepository['search']>(),
  countSearch: jest.fn<IClientRepository['countSearch']>(),
  findPaged: jest.fn<IClientRepository['findPaged']>(),
  update: jest.fn<IClientRepository['update']>(),
  findForExport: jest.fn<IClientRepository['findForExport']>(),
});

const makeMockUserRepository = (): jest.Mocked<IUserRepository> => ({
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
});

const makeMockRoleRepository = (): jest.Mocked<IRoleRepository> => ({
  findByName: jest.fn<IRoleRepository['findByName']>(),
  findById: jest.fn<IRoleRepository['findById']>(),
  create: jest.fn<IRoleRepository['create']>(),
  findAll: jest.fn<IRoleRepository['findAll']>(),
  assignRoleToUser: jest.fn<IRoleRepository['assignRoleToUser']>(),
  clearUserRoles: jest.fn<IRoleRepository['clearUserRoles']>(),
  revokeRoleFromUser: jest.fn<IRoleRepository['revokeRoleFromUser']>(),
});

const makeMockEmailService = (): jest.Mocked<IEmailService> => ({
  sendEmail: jest.fn<IEmailService['sendEmail']>(),
});

/**
 * Transparent transaction manager — executes the callback immediately with a
 * null tx context, matching real Prisma.$transaction behaviour in unit tests.
 */
const makeMockTransactionManager = () => {
  const runMock = jest.fn().mockImplementation((...args: unknown[]) => {
    const callback = args[0] as (tx: any) => Promise<any>;
    return callback(null);
  });
  return { run: runMock } as unknown as jest.Mocked<ITransactionManager>;
};

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const fakeClient: Client = {
  id: 42,
  email: 'cliente@dmendoza.com',
  name: 'Juan Cliente',
  phone: '987654321',
  documentId: '12345678',
  userId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const fakeLinkedClient: Client = { ...fakeClient, userId: 10 };

const fakeNewUser: User = {
  id: 99,
  email: fakeClient.email!,
  name: fakeClient.name,
  password: 'hashed_password',
  authProvider: 'local',
  lastLogin: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const fakeClientRole: Role = {
  id: 2,
  name: 'CLIENT',
  description: 'Rol estándar para compradores',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------------------------
// LinkClientUseCase tests (C-03)
// ---------------------------------------------------------------------------

describe('LinkClientUseCase (HU-008)', () => {
  let clientRepo: jest.Mocked<IClientRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let roleRepo: jest.Mocked<IRoleRepository>;
  let emailService: jest.Mocked<IEmailService>;
  let txManager: jest.Mocked<ITransactionManager>;
  let mockJwtService: any;
  let useCase: LinkClientUseCase;

  beforeEach(() => {
    clientRepo = makeMockClientRepository();
    userRepo = makeMockUserRepository();
    roleRepo = makeMockRoleRepository();
    emailService = makeMockEmailService();
    txManager = makeMockTransactionManager();
    mockJwtService = {
      generateWelcomePasswordToken: jest.fn().mockReturnValue('mock-reset-token'),
    };
    useCase = new LinkClientUseCase(
      clientRepo,
      userRepo,
      roleRepo,
      emailService,
      txManager,
      mockJwtService as any
    );
    jest.clearAllMocks();
    // Restore transaction manager mock after clearAllMocks
    txManager.run.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(null));
  });

  // ── Happy paths ──────────────────────────────────────────────────────────

  it('T-057: creates a new user, assigns CLIENT role, links client, and sends email', async () => {
    clientRepo.findById.mockResolvedValue(fakeClient);
    userRepo.findByEmail.mockResolvedValue(null);           // no prior account
    userRepo.create.mockResolvedValue(fakeNewUser);
    roleRepo.findByName.mockResolvedValue(fakeClientRole);
    roleRepo.assignRoleToUser.mockResolvedValue();
    clientRepo.linkUser.mockResolvedValue();
    emailService.sendEmail.mockResolvedValue();

    const result = await useCase.execute(42);

    expect(result.success).toBe(true);
    expect(result.message).toContain('credenciales');
    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(roleRepo.assignRoleToUser).toHaveBeenCalledWith(fakeNewUser.id, fakeClientRole.id, null);
    expect(clientRepo.linkUser).toHaveBeenCalledWith(fakeClient.id, fakeNewUser.id, null);
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      fakeClient.email!,
      expect.stringContaining('Activación'),
      expect.stringContaining('Omnicanal'),
    );
  });

  it('T-057b: links to an existing user account without creating a new one', async () => {
    const existingUser: User = { ...fakeNewUser, id: 10 };
    clientRepo.findById.mockResolvedValue(fakeClient);
    userRepo.findByEmail.mockResolvedValue(existingUser);   // existing account
    clientRepo.linkUser.mockResolvedValue();

    const result = await useCase.execute(42);

    expect(result.success).toBe(true);
    expect(result.message).toContain('existente');
    // Must NOT create a new user when one already exists
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(clientRepo.linkUser).toHaveBeenCalledWith(fakeClient.id, existingUser.id, null);
    // No email for existing-account flow
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('C-01: returns success with warning when email delivery fails (no DB rollback)', async () => {
    clientRepo.findById.mockResolvedValue(fakeClient);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(fakeNewUser);
    roleRepo.findByName.mockResolvedValue(fakeClientRole);
    roleRepo.assignRoleToUser.mockResolvedValue();
    clientRepo.linkUser.mockResolvedValue();
    emailService.sendEmail.mockRejectedValue(new Error('SMTP connection timeout'));

    const result = await useCase.execute(42);

    // The use case must NOT propagate the email error
    expect(result.success).toBe(true);
    expect(result.message).toContain('Advertencia');
    // The DB operations must have completed (linkUser was called inside the tx)
    expect(clientRepo.linkUser).toHaveBeenCalled();
  });

  // ── Guard clauses ────────────────────────────────────────────────────────

  it('throws when the client is not found', async () => {
    clientRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow('Cliente no encontrado');
    expect(txManager.run).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('throws when the client already has a linked account', async () => {
    clientRepo.findById.mockResolvedValue(fakeLinkedClient);

    await expect(useCase.execute(42)).rejects.toThrow('El cliente ya tiene una cuenta vinculada');
    expect(txManager.run).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('runs all DB writes inside a single transaction', async () => {
    clientRepo.findById.mockResolvedValue(fakeClient);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(fakeNewUser);
    roleRepo.findByName.mockResolvedValue(fakeClientRole);
    roleRepo.assignRoleToUser.mockResolvedValue();
    clientRepo.linkUser.mockResolvedValue();
    emailService.sendEmail.mockResolvedValue();

    await useCase.execute(42);

    // The transaction manager must have been called exactly once
    expect(txManager.run).toHaveBeenCalledTimes(1);
  });

  it('skips role assignment when CLIENT role does not exist in the catalog', async () => {
    clientRepo.findById.mockResolvedValue(fakeClient);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(fakeNewUser);
    roleRepo.findByName.mockResolvedValue(null);            // role not found
    clientRepo.linkUser.mockResolvedValue();
    emailService.sendEmail.mockResolvedValue();

    const result = await useCase.execute(42);

    expect(result.success).toBe(true);
    expect(roleRepo.assignRoleToUser).not.toHaveBeenCalled();
    expect(clientRepo.linkUser).toHaveBeenCalled();
  });
});


