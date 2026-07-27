import { ICashRegisterRepository } from '@domain/repositories/ICashRegisterRepository';
import { CreateCashRegisterRequestDTO, CashRegisterResponseDTO } from '../../dtos/CashRegisterDTOs';
import prisma from '@infrastructure/database/prisma';

export class CreateCashRegisterUseCase {
  constructor(private readonly cashRegisterRepository: ICashRegisterRepository) {}

  async execute(dto: CreateCashRegisterRequestDTO): Promise<CashRegisterResponseDTO> {
    // 1. Validar que la sucursal exista y esté activa
    const branch = await prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) {
      throw new Error(`La sucursal con ID ${dto.branchId} no existe`);
    }
    if (!branch.isActive) {
      throw new Error(`La sucursal '${branch.name}' se encuentra inactiva`);
    }

    // 2. Crear caja registradora
    const register = await this.cashRegisterRepository.create(dto);

    return {
      id: register.id!,
      branchId: register.branchId,
      name: register.name,
      createdAt: register.createdAt!,
      updatedAt: register.updatedAt!,
    };
  }
}
