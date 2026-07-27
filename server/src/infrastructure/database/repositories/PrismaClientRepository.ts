import prisma from '@infrastructure/database/prisma';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { Client, CreateClientDTO } from '@domain/entities/Client';

export class PrismaClientRepository implements IClientRepository {
  async findById(id: number): Promise<Client | null> {
    const record = await prisma.client.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const record = await prisma.client.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findAllWithoutUser(): Promise<Client[]> {
    const records = await prisma.client.findMany({
      where: { userId: null },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  async create(data: CreateClientDTO): Promise<Client> {
    const record = await prisma.client.create({
      data: {
        email: data.email,
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        documentType: data.documentType,
        documentId: data.documentId,
        address: data.address,
        department: data.department,
        province: data.province,
        district: data.district,
        ubigeo: data.ubigeo,
      },
    });
    return this.toDomain(record);
  }

  async linkUser(clientId: number, userId: number, tx?: any): Promise<void> {
    const client = tx || prisma;
    await client.client.update({
      where: { id: clientId },
      data: { userId },
    });
  }

  async search(query: string, skip: number, take: number): Promise<Client[]> {
    const records = await prisma.client.findMany({
      where: {
        OR: [
          { documentId: { contains: query } },
          { name: { contains: query } },
          { lastName: { contains: query } },
        ],
      },
      skip,
      take,
      orderBy: { name: 'asc' },
    });
    return records.map((r: any) => this.toDomain(r));
  }

  async countSearch(query: string): Promise<number> {
    return prisma.client.count({
      where: {
        OR: [
          { documentId: { contains: query } },
          { name: { contains: query } },
          { lastName: { contains: query } },
        ],
      },
    });
  }

  async findPaged(params: {
    type: 'POS' | 'ECOMMERCE' | 'ALL';
    search?: string;
    skip: number;
    take: number;
  }): Promise<{ clients: any[]; totalCount: number }> {
    const { type, search, skip, take } = params;
    const conditions: any[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search } },
          { lastName: { contains: search } },
          { documentId: { contains: search } },
        ],
      });
    }

    if (type === 'POS') {
      conditions.push({
        OR: [
          { userId: null },
          { user: { isActive: false } },
        ],
      });
    } else if (type === 'ECOMMERCE') {
      conditions.push({ userId: { not: null } });
      conditions.push({ user: { isActive: true } });
    }

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

    const [records, totalCount] = await prisma.$transaction([
      prisma.client.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              isActive: true,
              _count: {
                select: { orders: true },
              },
            },
          },
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.client.count({
        where: whereClause,
      }),
    ]);

    const clientsMapped = records.map((record: any) => {
      const domainClient = this.toDomain(record);
      return {
        ...domainClient,
        user: record.user ? {
          isActive: record.user.isActive,
          ordersCount: record.user._count?.orders ?? 0,
        } : null,
      };
    });

    return {
      clients: clientsMapped,
      totalCount,
    };
  }

  async update(id: number, data: Partial<CreateClientDTO>): Promise<Client> {
    const record = await prisma.client.update({
      where: { id },
      data: {
        email: data.email !== undefined ? data.email : undefined,
        name: data.name !== undefined ? data.name : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        documentType: data.documentType !== undefined ? data.documentType : undefined,
        documentId: data.documentId !== undefined ? data.documentId : undefined,
        address: data.address !== undefined ? data.address : undefined,
        department: data.department !== undefined ? data.department : undefined,
        province: data.province !== undefined ? data.province : undefined,
        district: data.district !== undefined ? data.district : undefined,
        ubigeo: data.ubigeo !== undefined ? data.ubigeo : undefined,
      },
    });
    return this.toDomain(record);
  }

  async findForExport(params: { from?: Date; to?: Date }): Promise<any[]> {
    const { from, to } = params;
    const conditions: any[] = [];
    if (from || to) {
      const dateCond: any = {};
      if (from) dateCond.gte = from;
      if (to) dateCond.lte = to;
      conditions.push({ createdAt: dateCond });
    }
    const whereClause = conditions.length > 0 ? { AND: conditions } : {};
    
    const records = await prisma.client.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            isActive: true,
            _count: {
              select: { orders: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return records.map((record: any) => {
      const domainClient = this.toDomain(record);
      return {
        ...domainClient,
        user: record.user ? {
          isActive: record.user.isActive,
          ordersCount: record.user._count?.orders ?? 0,
        } : null,
      };
    });
  }

  private toDomain(record: any): Client {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      lastName: record.lastName,
      phone: record.phone,
      documentType: record.documentType,
      documentId: record.documentId,
      address: record.address,
      department: record.department,
      province: record.province,
      district: record.district,
      ubigeo: record.ubigeo,
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

