import { IBranchRepository } from '@domain/repositories/IBranchRepository';
import { Branch } from '@domain/entities/Branch';
import { BranchResponseDTO } from '../../dtos/BranchDTOs';

export class ToggleBranchStatusUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(id: number, isActive: boolean): Promise<BranchResponseDTO> {
    const branch = await this.branchRepository.findById(id);
    if (!branch) {
      throw new Error('La sucursal no existe');
    }

    const updated = await this.branchRepository.updateStatus(id, isActive);
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
      warehouse: branch.warehouse
        ? {
            id: branch.warehouse.id,
            createdAt: branch.warehouse.createdAt,
          }
        : null,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }
}
