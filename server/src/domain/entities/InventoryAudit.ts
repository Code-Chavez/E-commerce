export type AuditStatus = 'PENDING' | 'CONFIRMED';

export interface AuditItem {
  id?: number;
  auditId?: number;
  variantId: number;
  physicalQty: number;
  systemQty: number;
  difference: number;
}

export interface InventoryAudit {
  id?: number;
  branchId: number;
  status: AuditStatus;
  items: AuditItem[];
  createdAt?: Date;
  updatedAt?: Date;
}
