import { ICashTurnRepository } from '@domain/repositories/ICashTurnRepository';
import { OpenCashTurnRequestDTO, CashTurnResponseDTO } from '../../dtos/CashTurnDTOs';

export class OpenCashTurnUseCase {
  constructor(private readonly cashTurnRepository: ICashTurnRepository) {}

  async execute(dto: OpenCashTurnRequestDTO): Promise<CashTurnResponseDTO> {
    // 1. Validar que la caja registradora exista
    const register = await this.cashTurnRepository.findRegisterById(dto.registerId);
    if (!register) {
      throw new Error(`La caja registradora con ID ${dto.registerId} no existe`);
    }

    // 2. Validar que la caja no esté ocupada por un turno activo
    const activeRegisterTurn = await this.cashTurnRepository.findActiveByRegister(dto.registerId);
    if (activeRegisterTurn) {
      throw new Error(`La caja registradora '${register.name}' ya tiene un turno abierto activo`);
    }

    // 3. Validar que el usuario no tenga ya un turno abierto
    const activeUserTurn = await this.cashTurnRepository.findActiveByUser(dto.userId);
    if (activeUserTurn) {
      throw new Error(`El usuario ya tiene un turno abierto en la caja con ID ${activeUserTurn.registerId}`);
    }

    // 4. Crear el turno de caja
    const turn = await this.cashTurnRepository.create({
      registerId: dto.registerId,
      userId: dto.userId,
      openAmount: dto.openAmount,
    });

    return {
      id: turn.id!,
      registerId: turn.registerId,
      userId: turn.userId,
      openAmount: turn.openAmount,
      status: turn.status,
      openedAt: turn.openedAt!,
      closedAt: turn.closedAt ?? null,
      createdAt: turn.createdAt!,
      updatedAt: turn.updatedAt!,
      branchId: turn.branchId ?? null,
      igvExempt: turn.igvExempt ?? false,
    };
  }
}
