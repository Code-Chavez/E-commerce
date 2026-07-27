import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UpdateProfileUseCase } from '@application/use-cases/profile/UpdateProfileUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IStorageService } from '@domain/services/IStorageService';
import { User } from '@domain/entities/User';

describe('UpdateProfileUseCase (HU-005)', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockStorageService: jest.Mocked<IStorageService>;
  let useCase: UpdateProfileUseCase;

  const mockUser: User = {
    id: 1,
    email: 'client@mendoza.com',
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+51999888777',
    password: '$2b$12$hashedPassword',
    googleId: null,
    avatarUrl: 'https://cloudinary.com/old_avatar.png',
    authProvider: 'local',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findById: jest.fn<IUserRepository['findById']>().mockResolvedValue(mockUser),
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
      updateProfile: jest.fn<IUserRepository['updateProfile']>().mockImplementation(async (userId, data) => ({
        ...mockUser,
        id: userId,
        name: data.name !== undefined ? data.name : mockUser.name,
        lastName: data.lastName !== undefined ? data.lastName : mockUser.lastName,
        phone: data.phone !== undefined ? data.phone : mockUser.phone,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : mockUser.avatarUrl,
      })),
    } as any;

    mockStorageService = {
      uploadImage: jest.fn<IStorageService['uploadImage']>().mockResolvedValue('https://cloudinary.com/new_avatar.png'),
      deleteImage: jest.fn<IStorageService['deleteImage']>(),
    };

    useCase = new UpdateProfileUseCase(mockUserRepository, mockStorageService);
  });

  it('should update profile fields successfully without uploading an avatar', async () => {
    const dto = {
      name: 'Carlos',
      lastName: 'Gómez',
      phone: '+51987654321',
    };

    const result = await useCase.execute(1, dto);

    // Verify repository checks
    expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    expect(mockStorageService.uploadImage).not.toHaveBeenCalled();
    expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(1, {
      name: 'Carlos',
      lastName: 'Gómez',
      phone: '+51987654321',
      avatarUrl: undefined,
    });

    // Verify response
    expect(result.name).toBe('Carlos');
    expect(result.lastName).toBe('Gómez');
    expect(result.phone).toBe('+51987654321');
    expect(result.avatarUrl).toBe(mockUser.avatarUrl); // Unchanged
  });

  it('should upload avatar and update profile details when avatarFile is provided', async () => {
    const dto = {
      name: 'Carlos',
      avatarFile: {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'my_avatar.png',
      },
    };

    const result = await useCase.execute(1, dto);

    // Verify image upload service was executed
    expect(mockStorageService.uploadImage).toHaveBeenCalledWith(
      dto.avatarFile.buffer,
      dto.avatarFile.originalname
    );

    // Verify database profile update
    expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(1, {
      name: 'Carlos',
      lastName: undefined,
      phone: undefined,
      avatarUrl: 'https://cloudinary.com/new_avatar.png',
    });

    expect(result.name).toBe('Carlos');
    expect(result.avatarUrl).toBe('https://cloudinary.com/new_avatar.png');
  });

  it('should throw an error if the user to update does not exist', async () => {
    mockUserRepository.findById.mockResolvedValueOnce(null);

    const dto = {
      name: 'Carlos',
    };

    await expect(useCase.execute(999, dto)).rejects.toThrow('Usuario no encontrado');
    expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
  });
});


