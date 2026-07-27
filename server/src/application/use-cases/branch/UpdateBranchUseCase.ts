import { IBranchRepository } from '@domain/repositories/IBranchRepository';
import { Branch } from '@domain/entities/Branch';
import { UpdateBranchRequestDTO, BranchResponseDTO } from '../../dtos/BranchDTOs';

export class UpdateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(id: number, dto: UpdateBranchRequestDTO): Promise<BranchResponseDTO> {
    const branch = await this.branchRepository.findById(id);
    if (!branch) {
      throw new Error('La sucursal no existe');
    }

    if (dto.name && dto.name !== branch.name) {
      const existing = await this.branchRepository.findByName(dto.name);
      if (existing) {
        throw new Error('El nombre de la sucursal ya está registrado');
      }
    }

    if (dto.isMain) {
      await this.branchRepository.unsetOtherMainBranches(id);
    }

    const updated = await this.branchRepository.update(id, dto);
    return this.mapToDTO(updated);
  }

  private mapToDTO(branch: Branch): BranchResponseDTO {
    return {
      id: branch.id,
      name: branch.name,
      address: branch.address ?? null,
      phone: branch.phone ?? null,
      isActive: branch.isActive,
      isMain: branch.isMain,
      igvExempt: branch.igvExempt,
      warehouse: branch.warehouse ? {
        id: branch.warehouse.id,
        createdAt: branch.warehouse.createdAt,
      } : null,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }
}
