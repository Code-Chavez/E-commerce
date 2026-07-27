/**
 * DTO para la solicitud de actualización del perfil del cliente.
 */
export interface UpdateProfileRequestDTO {
  name?: string;
  lastName?: string;
  phone?: string;
  birthdate?: Date;
  avatarFile?: {
    buffer: Buffer;
    originalname: string;
  };
}

/**
 * DTO de respuesta para el perfil del cliente actualizado (sin campos sensibles).
 */
export interface ProfileResponseDTO {
  id: number;
  email: string;
  name: string | null;
  lastName: string | null;
  phone: string | null;
  birthdate?: Date | null;
  avatarUrl: string | null;
  authProvider: string;
  createdAt: Date;
  updatedAt: Date;
}
