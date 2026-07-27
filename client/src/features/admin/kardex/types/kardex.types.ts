// KardexType enum (espeja el backend exactamente)
export type KardexType = 'COMPRA' | 'VENTA' | 'TRANSFERENCIA' | 'DEVOLUCION' | 'AJUSTE';
export type ValuationMethod = 'PROMEDIO_PONDERADO' | 'PEPS';

export interface KardexEntry {
  id: number;
  type: KardexType;
  quantity: number;
  unitCost: number;
  salePrice: number;
  balanceQty: number;
  balanceCost: number;
  sku: string;
  branch: string;
  userName: string | null;   // Resultado del ajuste Fase 0
  createdAt: string;
}

export interface KardexFilters {
  variantId: number | null;
  branchId: number | null;
  from?: string;
  to?: string;
  type?: KardexType | '';
}

export interface InventorySettings {
  valuationMethod: ValuationMethod;
}
