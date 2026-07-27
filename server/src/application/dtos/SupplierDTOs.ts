// ─── HU-051 T-090: DTOs de Proveedor ─────────────────────────────────────────

export interface SupplierResponseDTO {
  id: number;
  ruc: string;
  razonSocial: string;
  contacto: string;
  rubro: string;
  direccion: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierRequestDTO {
  ruc: string;
  razonSocial: string;
  contacto: string;
  rubro: string;
  direccion?: string | null;
}

export interface UpdateSupplierRequestDTO {
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  rubro?: string;
  direccion?: string | null;
}
