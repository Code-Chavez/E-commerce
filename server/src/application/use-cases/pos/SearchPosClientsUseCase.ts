import { IClientRepository } from '@domain/repositories/IClientRepository';
import { Client } from '@domain/entities/Client';

export interface SearchPosClientsResponseDTO {
  clients: Client[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export class SearchPosClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(query: string, page: number = 1): Promise<SearchPosClientsResponseDTO> {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.clientRepository.search(query, skip, limit),
      this.clientRepository.countSearch(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      clients: records,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }
}
