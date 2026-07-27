import { IClientRepository } from '@domain/repositories/IClientRepository';
import { UnifiedClientsPagedResponse, ClientAdminResponseDto } from '@application/dtos/ClientAdminResponseDto';

export class GetUnifiedClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(params: {
    type: 'POS' | 'ECOMMERCE' | 'ALL';
    search?: string;
    page: number;
    limit: number;
  }): Promise<UnifiedClientsPagedResponse> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const { clients: rawClients, totalCount } = await this.clientRepository.findPaged({
      type: params.type,
      search: params.search,
      skip,
      take: limit,
    });

    const clients = rawClients.map((client): ClientAdminResponseDto => {
      let clientType: 'POS' | 'ECOMMERCE' | 'AMBOS' = 'POS';
      let isActive = true; // Por defecto activo para registros únicamente POS (sin cuenta vinculada)

      if (client.userId && client.user) {
        isActive = client.user.isActive;
        if (client.user.isActive) {
          clientType = client.user.ordersCount > 0 ? 'AMBOS' : 'ECOMMERCE';
        } else {
          clientType = 'POS';
        }
      }

      return {
        id: client.id,
        email: client.email,
        name: client.name,
        lastName: client.lastName,
        phone: client.phone,
        documentType: client.documentType,
        documentId: client.documentId,
        address: client.address,
        department: client.department,
        province: client.province,
        district: client.district,
        ubigeo: client.ubigeo,
        userId: client.userId,
        isActive,
        type: clientType,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      clients,
      pagination: {
        total: totalCount,
        page,
        totalPages,
        limit,
      },
    };
  }
}
