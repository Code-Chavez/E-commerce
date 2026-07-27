import { InventoryAudit } from '../entities/InventoryAudit';

export interface CreateInventoryAuditDTO {
  branchId: number;
  status: 'PENDING' | 'CONFIRMED';
  items: {
    variantId: number;
    physicalQty: number;
    systemQty: number;
    difference: number;
  }[];
}

export interface IInventoryAuditRepository {
  create(data: CreateInventoryAuditDTO): Promise<InventoryAudit>;
  findById(id: number): Promise<InventoryAudit | null>;
  findAllByBranch(branchId: number): Promise<InventoryAudit[]>;
}
