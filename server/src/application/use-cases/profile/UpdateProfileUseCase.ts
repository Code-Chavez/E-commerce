import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IStorageService } from '@domain/services/IStorageService';
import { UpdateProfileRequestDTO, ProfileResponseDTO } from '@application/dtos/ProfileDTO';

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(userId: number, dto: UpdateProfileRequestDTO): Promise<ProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let avatarUrl: string | undefined = undefined;

    if (dto.avatarFile) {
      // Securely upload avatar using decoupled IStorageService port
      avatarUrl = await this.storageService.uploadImage(
        dto.avatarFile.buffer,
        dto.avatarFile.originalname
      );
    }

    // Call repository port to apply updates
    const updatedUser = await this.userRepository.updateProfile(userId, {
      name: dto.name,
      lastName: dto.lastName,
      phone: dto.phone,
      birthdate: dto.birthdate,
      avatarUrl,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      lastName: updatedUser.lastName ?? null,
      phone: updatedUser.phone ?? null,
      birthdate: updatedUser.birthdate ?? null,
      avatarUrl: updatedUser.avatarUrl ?? null,
      authProvider: updatedUser.authProvider,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
