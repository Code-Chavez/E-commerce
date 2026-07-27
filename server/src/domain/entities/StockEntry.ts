// ─── HU-051: Gestión de Proveedores y Registro de Ingreso de Mercadería ─────────

import { Supplier } from './Supplier';

export interface StockEntryItem {
  id: number;
  stockEntryId: number;
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface StockEntry {
  id: number;
  supplierId: number;
  invoiceNumber: string;
  branchId: number;
  items: StockEntryItem[];
  supplier?: Supplier;
  createdAt: Date;
  updatedAt: Date;
}
