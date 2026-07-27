import { UserResponseDTO } from '@application/dtos/user.dto';

/**
 * DTO de entrada para el caso de uso de login.
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * DTO de resultado para login exitoso.
 * Retorna el usuario sin datos sensibles.
 */
export interface LoginResultDTO {
  user: UserResponseDTO;
}
