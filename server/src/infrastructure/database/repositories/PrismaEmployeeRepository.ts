import prisma from '@infrastructure/database/prisma';
import { IEmployeeRepository } from '@domain/repositories/IEmployeeRepository';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '@domain/entities/Employee';

export class PrismaEmployeeRepository implements IEmployeeRepository {
  async findById(id: number): Promise<Employee | null> {
    const record = await prisma.employee.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByDni(dni: string): Promise<Employee | null> {
    const record = await prisma.employee.findUnique({ where: { dni } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(params: { page: number; limit: number; search?: string }): Promise<{ items: Employee[]; total: number }> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { dni: { contains: search } }
      ]
    } : {};

    const [records, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { branch: true }
      }),
      prisma.employee.count({ where })
    ]);

    return {
      items: records.map(this.toDomain),
      total
    };
  }

  async create(data: CreateEmployeeDTO): Promise<Employee> {
    const record = await prisma.employee.create({
      data: {
        name: data.name,
        dni: data.dni,
        branchId: data.branchId,
        userId: data.userId || null,
      }
    });
    return this.toDomain(record);
  }

  async update(id: number, data: UpdateEmployeeDTO): Promise<Employee> {
    const record = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        branchId: data.branchId
      }
    });
    return this.toDomain(record);
  }

  async toggleStatus(id: number, isActive: boolean): Promise<void> {
    await prisma.employee.update({
      where: { id },
      data: { isActive }
    });
  }

  private toDomain(record: any): Employee {
    return {
      id: record.id,
      name: record.name,
      dni: record.dni,
      isActive: record.isActive,
      userId: record.userId,
      branchId: record.branchId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
