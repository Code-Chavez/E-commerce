import { ICashRegisterRepository } from '@domain/repositories/ICashRegisterRepository';
import { UpdateCashRegisterRequestDTO, CashRegisterResponseDTO } from '../../dtos/CashRegisterDTOs';
import prisma from '@infrastructure/database/prisma';

export class UpdateCashRegisterUseCase {
  constructor(private readonly cashRegisterRepository: ICashRegisterRepository) {}

  async execute(id: number, dto: UpdateCashRegisterRequestDTO): Promise<CashRegisterResponseDTO> {
    // 1. Validar que la caja exista
    const register = await this.cashRegisterRepository.findById(id);
    if (!register) {
      throw new Error(`La caja registradora con ID ${id} no existe o fue eliminada`);
    }

    // 2. Si se actualiza la sucursal, validar que exista y esté activa
    if (dto.branchId !== undefined) {
      const branch = await prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!branch) {
        throw new Error(`La sucursal con ID ${dto.branchId} no existe`);
      }
      if (!branch.isActive) {
        throw new Error(`La sucursal '${branch.name}' se encuentra inactiva`);
      }
    }

    // 3. Actualizar caja registradora
    const updatedRegister = await this.cashRegisterRepository.update(id, dto);

    return {
      id: updatedRegister.id!,
      branchId: updatedRegister.branchId,
      name: updatedRegister.name,
      createdAt: updatedRegister.createdAt!,
      updatedAt: updatedRegister.updatedAt!,
    };
  }
}
