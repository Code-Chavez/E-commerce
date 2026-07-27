import prisma from '@infrastructure/database/prisma';
import {
  IBranchRepository,
  CreateBranchDTO,
  UpdateBranchDTO,
} from '@domain/repositories/IBranchRepository';
import { Branch } from '@domain/entities/Branch';

export class PrismaBranchRepository implements IBranchRepository {
  async findById(id: number): Promise<Branch | null> {
    const record = await prisma.branch.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByName(name: string): Promise<Branch | null> {
    const record = await prisma.branch.findUnique({
      where: { name },
      include: { warehouse: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Branch[]> {
    const records = await prisma.branch.findMany({
      include: { warehouse: true },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateBranchDTO): Promise<Branch> {
    // Transacción atómica garantizada para cumplir la relación 1:1 de negocio
    const record = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.branch.create({
        data: {
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          isActive: true,
          isMain: data.isMain ?? false,
          igvExempt: data.igvExempt ?? false,
        },
      });

      const newWarehouse = await tx.warehouse.create({
        data: {
          branchId: newBranch.id,
        },
      });

      return {
        ...newBranch,
        warehouse: newWarehouse,
      };
    });

    return this.toDomain(record);
  }

  async update(id: number, data: UpdateBranchDTO): Promise<Branch> {
    const record = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        isMain: data.isMain,
        igvExempt: data.igvExempt,
      },
      include: { warehouse: true },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: number, isActive: boolean): Promise<Branch> {
    const record = await prisma.branch.update({
      where: { id },
      data: { isActive },
      include: { warehouse: true },
    });
    return this.toDomain(record);
  }

  async unsetOtherMainBranches(excludeId?: number): Promise<void> {
    await prisma.branch.updateMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        isMain: true,
      },
      data: {
        isMain: false,
      },
    });
  }

  private toDomain(record: any): Branch {
    return {
      id: record.id,
      name: record.name,
      address: record.address,
      phone: record.phone,
      isActive: record.isActive,
      isMain: record.isMain,
      igvExempt: record.igvExempt ?? false,
      warehouse: record.warehouse
        ? {
            id: record.warehouse.id,
            branchId: record.warehouse.branchId,
            createdAt: record.warehouse.createdAt,
            updatedAt: record.warehouse.updatedAt,
          }
        : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
