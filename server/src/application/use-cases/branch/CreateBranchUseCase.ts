import { IBranchRepository } from '@domain/repositories/IBranchRepository';
import { Branch } from '@domain/entities/Branch';
import {
  CreateBranchRequestDTO,
  BranchResponseDTO,
} from '../../dtos/BranchDTOs';

export class CreateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(dto: CreateBranchRequestDTO): Promise<BranchResponseDTO> {
    const existing = await this.branchRepository.findByName(dto.name);
    if (existing) {
      throw new Error('El nombre de la sucursal ya está registrado');
    }

    if (dto.isMain) {
      await this.branchRepository.unsetOtherMainBranches();
    }

    const branch = await this.branchRepository.create(dto);
    return this.mapToDTO(branch);
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
