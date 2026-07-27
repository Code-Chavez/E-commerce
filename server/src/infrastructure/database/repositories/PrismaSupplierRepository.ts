// ─── HU-051 T-090: Implementación Prisma del repositorio de Proveedores ──────

import prisma from '@infrastructure/database/prisma';
import {
  ISupplierRepository,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from '@domain/repositories/ISupplierRepository';
import { Supplier } from '@domain/entities/Supplier';
import { Supplier as PrismaSupplier } from '@prisma/client';

export class PrismaSupplierRepository implements ISupplierRepository {
  async findById(id: number): Promise<Supplier | null> {
    const record = await prisma.supplier.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByRuc(ruc: string): Promise<Supplier | null> {
    const record = await prisma.supplier.findUnique({ where: { ruc } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Supplier[]> {
    const records = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async create(data: CreateSupplierDTO): Promise<Supplier> {
    const record = await prisma.supplier.create({
      data: {
        ruc: data.ruc,
        razonSocial: data.razonSocial,
        contacto: data.contacto,
        rubro: data.rubro,
        direccion: data.direccion ?? null,
      },
    });
    return this.toDomain(record);
  }

  async update(id: number, data: UpdateSupplierDTO): Promise<Supplier> {
    const record = await prisma.supplier.update({
      where: { id },
      data: {
        ruc: data.ruc,
        razonSocial: data.razonSocial,
        contacto: data.contacto,
        rubro: data.rubro,
        direccion: data.direccion,
      },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: number, isActive: boolean): Promise<Supplier> {
    const record = await prisma.supplier.update({
      where: { id },
      data: { isActive },
    });
    return this.toDomain(record);
  }

  private toDomain(record: PrismaSupplier): Supplier {
    return {
      id: record.id,
      ruc: record.ruc,
      razonSocial: record.razonSocial,
      contacto: record.contacto,
      rubro: record.rubro,
      direccion: record.direccion,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
