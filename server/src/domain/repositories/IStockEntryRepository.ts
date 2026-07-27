// ─── HU-051: Puerto de Persistencia de Ingreso de Mercadería ────────────────────

import { StockEntry } from '../entities/StockEntry';

export interface CreateStockEntryItemDTO {
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface CreateStockEntryDTO {
  supplierId: number;
  invoiceNumber: string;
  branchId: number;
  items: CreateStockEntryItemDTO[];
  distributionItems?: {
    branchId: number;
    variantId: number;
    quantity: number;
  }[];
}

export interface IStockEntryRepository {
  create(data: CreateStockEntryDTO): Promise<StockEntry>;
  findById(id: number): Promise<StockEntry | null>;
  findAll(): Promise<StockEntry[]>;
}
