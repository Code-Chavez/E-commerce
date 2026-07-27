import prisma from '@infrastructure/database/prisma';

export interface GetReceiptsFilters {
  branchId?: number;
  from?: Date;
  to?: Date;
  type?: 'cross-branch' | 'normal';
  page?: number;
  limit?: number;
}

export interface ReceiptsPagedResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: Array<{
    orderId: number;
    status: string;
    subtotal: number;
    discountTotal: number;
    total: number;
    isCrossBranch: boolean;
    sourceBranch: { id: number; name: string } | null;
    branch: { id: number; name: string };
    createdAt: Date;
    seller: {
      id: number;
      name: string;
      lastName: string | null;
      email: string;
    } | null;
    client: {
      id: number;
      name: string;
      lastName: string | null;
      documentId: string | null;
    } | null;
    documentType?: string;
    series?: string | null;
    correlative?: number | null;
  }>;
}

export class GetReceiptsUseCase {
  async execute(filters: GetReceiptsFilters): Promise<ReceiptsPagedResult> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Filtro por sucursal
    if (filters.branchId) {
      whereClause.branchId = filters.branchId;
    }

    // Filtro por tipo de orden (Cross-Branch o Normal)
    if (filters.type) {
      whereClause.isCrossBranch = filters.type === 'cross-branch';
    }

    // Filtros por fecha
    if (filters.from || filters.to) {
      whereClause.createdAt = {};
      if (filters.from) {
        whereClause.createdAt.gte = filters.from;
      }
      if (filters.to) {
        whereClause.createdAt.lte = filters.to;
      }
    }

    // Consultar el total de elementos
    const total = await prisma.posOrder.count({ where: whereClause });

    // Consultar elementos paginados
    const orders = await prisma.posOrder.findMany({
      where: whereClause,
      include: {
        branch: {
          select: { id: true, name: true },
        },
        sourceBranch: {
          select: { id: true, name: true },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const results = [];

    for (const order of orders) {
      // Resolver vendedor (User)
      let seller = null;
      if (order.userId) {
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { id: true, name: true, lastName: true, email: true },
        });
        if (user) {
          seller = {
            id: user.id,
            name: user.name || 'Vendedor',
            lastName: user.lastName,
            email: user.email,
          };
        }
      }

      // Resolver cliente (Client)
      // Buscamos si existe un registro en Client vinculado al userId del cajero/comprador 
      // o buscamos si el perfil tiene algún cliente asignado.
      let client = null;
      if (order.userId) {
        const dbClient = await prisma.client.findFirst({
          where: { userId: order.userId },
          select: { id: true, name: true, lastName: true, documentId: true },
        });
        if (dbClient) {
          client = {
            id: dbClient.id,
            name: dbClient.name,
            lastName: dbClient.lastName,
            documentId: dbClient.documentId,
          };
        }
      }

      results.push({
        orderId: order.id,
        status: order.status,
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discountTotal),
        total: Number(order.total),
        isCrossBranch: order.isCrossBranch,
        sourceBranch: order.sourceBranch,
        branch: order.branch,
        createdAt: order.createdAt,
        seller,
        client,
        documentType: order.documentType,
        series: order.series,
        correlative: order.correlative,
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      results,
    };
  }
}
