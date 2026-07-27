import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { VerifyUserUseCase } from '@application/use-cases/auth/VerifyUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { User } from '@domain/entities/User';

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

const mockEmailService: jest.Mocked<IEmailService> = {
  sendEmail: jest.fn<IEmailService['sendEmail']>(),
};

// Helper: builds a valid User object with optional overrides
const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@dmendoza.com',
  name: 'Test User',
  password: '$2b$12$hashedpassword',
  authProvider: 'local',
  lastLogin: null,
  isActive: false,
  verificationPin: '123456',
  pinExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours ahead
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// ============================================================
// SUITE 1: RegisterUserUseCase
// ============================================================

describe('RegisterUserUseCase', () => {
  let registerUseCase: RegisterUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    registerUseCase = new RegisterUserUseCase(mockUserRepository, mockEmailService);
  });

  // --- Success path ---

  it('debería crear usuario inactivo y enviar PIN por email al registrarse correctamente', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(buildUser());
    mockUserRepository.updateVerificationPin.mockResolvedValue();
    mockEmailService.sendEmail.mockResolvedValue();

    const result = await registerUseCase.execute({
      email: 'test@dmendoza.com',
      password: 'Password1!',
    });

    // Usuario debe venir inactivo
    expect(result.isActive).toBe(false);
    expect(result.email).toBe('test@dmendoza.com');

    // El repositorio debe haber guardado el PIN
    expect(mockUserRepository.updateVerificationPin).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.updateVerificationPin).toHaveBeenCalledWith(
      1,
      expect.stringMatching(/^\d{6}$/),
      expect.any(Date),
    );

    // El servicio de email debe haberse invocado una vez
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      'test@dmendoza.com',
      expect.any(String),
      expect.stringContaining('24 horas'),
    );
  });

  it('debería hashear la contraseña antes de persistir (nunca guardar en texto plano)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(buildUser());
    mockUserRepository.updateVerificationPin.mockResolvedValue();
    mockEmailService.sendEmail.mockResolvedValue();

    await registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' });

    const createdWithData = mockUserRepository.create.mock.calls[0][0];
    // La contraseña persistida NO debe ser texto plano
    expect(createdWithData.password).not.toBe('Password1!');
    // Debe tener formato de hash bcrypt
    expect(createdWithData.password).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('el PIN generado debe tener exactamente 6 dígitos numéricos', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(buildUser());
    mockUserRepository.updateVerificationPin.mockResolvedValue();
    mockEmailService.sendEmail.mockResolvedValue();

    await registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' });

    const [, pin] = mockUserRepository.updateVerificationPin.mock.calls[0];
    expect(pin).toHaveLength(6);
    expect(pin).toMatch(/^\d{6}$/);
  });

  it('el PIN debe expirar dentro de un rango de 23.9–24.1 horas a partir de la creación', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(buildUser());
    mockUserRepository.updateVerificationPin.mockResolvedValue();
    mockEmailService.sendEmail.mockResolvedValue();

    const before = new Date();
    await registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' });
    const after = new Date();

    const [, , expiresAt] = mockUserRepository.updateVerificationPin.mock.calls[0];
    const diffMs = (expiresAt as Date).getTime() - before.getTime();

    // Expiración debe estar entre 23.9 y 24.1 horas (margen de ejecución del test)
    expect(diffMs).toBeGreaterThan(23.9 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThan(24.1 * 60 * 60 * 1000 + (after.getTime() - before.getTime()));
  });

  // --- Duplicate email (T-018 core requirement) ---

  it('[T-018] debería lanzar error con código de email duplicado si el correo ya existe', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(buildUser({ isActive: false }));

    await expect(
      registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' }),
    ).rejects.toThrow('Correo electrónico ya registrado');

    // No debe intentar crear ni enviar email
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
  });

  it('[T-018] no debe guardar el PIN si el email ya existe', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(
      registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' }),
    ).rejects.toThrow();

    expect(mockUserRepository.updateVerificationPin).not.toHaveBeenCalled();
  });

  // --- Email delivery failure rollback ---

  it('debería hacer rollback (eliminar usuario) si el envío de email falla', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(buildUser());
    mockUserRepository.updateVerificationPin.mockResolvedValue();
    mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP connection refused'));
    mockUserRepository.deleteById.mockResolvedValue();

    await expect(
      registerUseCase.execute({ email: 'test@dmendoza.com', password: 'Password1!' }),
    ).rejects.toThrow('El registro falló porque no se pudo despachar el código de verificación');

    // El usuario creado debe haber sido eliminado para mantener consistencia
    expect(mockUserRepository.deleteById).toHaveBeenCalledWith(1);
  });
});

// ============================================================
// SUITE 2: VerifyUserUseCase
// ============================================================

describe('VerifyUserUseCase', () => {
  let verifyUseCase: VerifyUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyUseCase = new VerifyUserUseCase(mockUserRepository);
  });

  // --- Success path ---

  it('debería activar la cuenta correctamente con PIN válido y no expirado', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(buildUser());
    mockUserRepository.activateUser.mockResolvedValue();

    await expect(
      verifyUseCase.execute({ email: 'test@dmendoza.com', pin: '123456' }),
    ).resolves.toBeUndefined();

    expect(mockUserRepository.activateUser).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.activateUser).toHaveBeenCalledWith(1);
  });

  // --- Invalid PIN ---

  it('debería lanzar error genérico con PIN incorrecto (no revelar si email existe)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(
      verifyUseCase.execute({ email: 'test@dmendoza.com', pin: '000000' }),
    ).rejects.toThrow('PIN inválido o expirado');

    expect(mockUserRepository.activateUser).not.toHaveBeenCalled();
  });

  it('debería lanzar error genérico si el email no existe (seguridad: no revelar emails registrados)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      verifyUseCase.execute({ email: 'noexiste@dmendoza.com', pin: '123456' }),
    ).rejects.toThrow('PIN inválido o expirado');

    expect(mockUserRepository.activateUser).not.toHaveBeenCalled();
  });

  // --- Expired PIN ---

  it('debería lanzar error de expiración si el PIN superó las 24 horas', async () => {
    const expiredUser = buildUser({
      pinExpiresAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min en el pasado
    });
    mockUserRepository.findByEmail.mockResolvedValue(expiredUser);

    await expect(
      verifyUseCase.execute({ email: 'test@dmendoza.com', pin: '123456' }),
    ).rejects.toThrow('El código de verificación ha expirado');

    expect(mockUserRepository.activateUser).not.toHaveBeenCalled();
  });

  // --- Already active ---

  it('[T-018] no debería verificar una cuenta que ya está activa', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(buildUser({ isActive: true }));

    await expect(
      verifyUseCase.execute({ email: 'test@dmendoza.com', pin: '123456' }),
    ).rejects.toThrow('La cuenta ya se encuentra verificada');

    expect(mockUserRepository.activateUser).not.toHaveBeenCalled();
  });

  // --- Missing PIN in DB ---

  it('debería lanzar error si el usuario no tiene un PIN activo en la base de datos', async () => {
    const userWithoutPin = buildUser({ verificationPin: null, pinExpiresAt: null });
    mockUserRepository.findByEmail.mockResolvedValue(userWithoutPin);

    await expect(
      verifyUseCase.execute({ email: 'test@dmendoza.com', pin: '123456' }),
    ).rejects.toThrow('No existe un código de verificación activo');

    expect(mockUserRepository.activateUser).not.toHaveBeenCalled();
  });
});


