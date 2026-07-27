// ─── HU-051 T-090: Crear un nuevo proveedor ──────────────────────────────────

import { ISupplierRepository } from '@domain/repositories/ISupplierRepository';
import { Supplier } from '@domain/entities/Supplier';
import {
  CreateSupplierRequestDTO,
  SupplierResponseDTO,
} from '../../dtos/SupplierDTOs';

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(dto: CreateSupplierRequestDTO): Promise<SupplierResponseDTO> {
    const existing = await this.supplierRepository.findByRuc(dto.ruc);
    if (existing) {
      throw new Error(`El RUC '${dto.ruc}' ya se encuentra registrado`);
    }

    const supplier = await this.supplierRepository.create({
      ruc: dto.ruc,
      razonSocial: dto.razonSocial,
      contacto: dto.contacto,
      rubro: dto.rubro,
      direccion: dto.direccion ?? null,
    });

    return this.mapToDTO(supplier);
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
