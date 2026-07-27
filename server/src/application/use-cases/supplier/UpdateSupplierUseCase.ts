// ─── HU-051 T-090: Actualizar datos de un proveedor ─────────────────────────

import { ISupplierRepository } from '@domain/repositories/ISupplierRepository';
import { Supplier } from '@domain/entities/Supplier';
import {
  UpdateSupplierRequestDTO,
  SupplierResponseDTO,
} from '../../dtos/SupplierDTOs';

export class UpdateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(
    id: number,
    dto: UpdateSupplierRequestDTO
  ): Promise<SupplierResponseDTO> {
    const existing = await this.supplierRepository.findById(id);
    if (!existing) {
      throw new Error(`El proveedor con ID ${id} no existe`);
    }

    // Verificar unicidad del RUC si se está cambiando
    if (dto.ruc && dto.ruc !== existing.ruc) {
      const duplicate = await this.supplierRepository.findByRuc(dto.ruc);
      if (duplicate) {
        throw new Error(`El RUC '${dto.ruc}' ya se encuentra registrado`);
      }
    }

    const updated = await this.supplierRepository.update(id, dto);
    return this.mapToDTO(updated);
  }

  private mapToDTO(supplier: Supplier): SupplierResponseDTO {
    return {
      id: supplier.id,
      ruc: supplier.ruc,
      razonSocial: supplier.razonSocial,
      contacto: supplier.contacto,
      rubro: supplier.rubro,
      direccion: supplier.direccion,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
