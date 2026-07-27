// ─── HU-051: Gestión de Proveedores y Registro de Ingreso de Mercadería ─────────

export interface Supplier {
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
