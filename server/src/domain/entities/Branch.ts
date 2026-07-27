import { Warehouse } from './Warehouse';

export interface Branch {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  isMain: boolean;
  igvExempt: boolean;
  warehouse: Warehouse | null;
  createdAt: Date;
  updatedAt: Date;
}

