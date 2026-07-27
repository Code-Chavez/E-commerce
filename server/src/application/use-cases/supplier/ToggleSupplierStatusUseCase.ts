// ─── HU-051 T-090: Activar / Inactivar proveedor (Soft delete lógico) ────────

import { ISupplierRepository } from '@domain/repositories/ISupplierRepository';
import { Supplier } from '@domain/entities/Supplier';
import { SupplierResponseDTO } from '../../dtos/SupplierDTOs';

export class ToggleSupplierStatusUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(id: number, isActive: boolean): Promise<SupplierResponseDTO> {
    const existing = await this.supplierRepository.findById(id);
    if (!existing) {
      throw new Error(`El proveedor con ID ${id} no existe`);
    }

    const updated = await this.supplierRepository.updateStatus(id, isActive);
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
