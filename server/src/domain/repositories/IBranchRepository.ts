import { Branch } from '../entities/Branch';

export interface CreateBranchDTO {
  name: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
  igvExempt?: boolean;
}

export interface UpdateBranchDTO {
  name?: string;
  address?: string | null;
  phone?: string | null;
  isMain?: boolean;
  igvExempt?: boolean;
}

export interface IBranchRepository {
  findById(id: number): Promise<Branch | null>;
  findByName(name: string): Promise<Branch | null>;
  findAll(): Promise<Branch[]>;
  create(data: CreateBranchDTO): Promise<Branch>;
  update(id: number, data: UpdateBranchDTO): Promise<Branch>;
  updateStatus(id: number, isActive: boolean): Promise<Branch>;
  unsetOtherMainBranches(excludeId?: number): Promise<void>;
}
