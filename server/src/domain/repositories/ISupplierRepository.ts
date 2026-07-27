// ─── HU-051: Puerto de Persistencia de Proveedores ──────────────────────────────

import { Supplier } from '../entities/Supplier';

export interface CreateSupplierDTO {
  ruc: string;
  razonSocial: string;
  contacto: string;
  rubro: string;
  direccion?: string | null;
}

export interface UpdateSupplierDTO {
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  rubro?: string;
  direccion?: string | null;
}

export interface ISupplierRepository {
  findById(id: number): Promise<Supplier | null>;
  findByRuc(ruc: string): Promise<Supplier | null>;
  findAll(): Promise<Supplier[]>;
  create(data: CreateSupplierDTO): Promise<Supplier>;
  update(id: number, data: UpdateSupplierDTO): Promise<Supplier>;
  updateStatus(id: number, isActive: boolean): Promise<Supplier>;
}
