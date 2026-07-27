// ─── HU-051 T-090: Listar todos los proveedores ──────────────────────────────

import { ISupplierRepository } from '@domain/repositories/ISupplierRepository';
import { SupplierResponseDTO } from '../../dtos/SupplierDTOs';
import { Supplier } from '@domain/entities/Supplier';

export class GetAllSuppliersUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(): Promise<SupplierResponseDTO[]> {
    const suppliers = await this.supplierRepository.findAll();
    return suppliers.map((s) => this.mapToDTO(s));
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
