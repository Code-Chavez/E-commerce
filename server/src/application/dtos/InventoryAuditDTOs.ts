export interface AuditItemRequestDTO {
  variantId: number;
  physicalQty: number;
}

export interface CreateInventoryAuditRequestDTO {
  branchId: number;
  status: 'PENDING' | 'CONFIRMED';
  items: AuditItemRequestDTO[];
}

export interface AuditItemResponseDTO {
  id?: number;
  variantId: number;
  physicalQty: number;
  systemQty: number;
  difference: number;
}

export interface InventoryAuditResponseDTO {
  id: number;
  branchId: number;
  status: 'PENDING' | 'CONFIRMED';
  items: AuditItemResponseDTO[];
  createdAt: Date;
  updatedAt: Date;
}
