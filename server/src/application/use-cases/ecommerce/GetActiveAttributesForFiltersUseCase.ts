import { Attribute } from '@domain/entities/Attribute';
import { PrismaAttributeRepository } from '@infrastructure/database/repositories/PrismaAttributeRepository';

export class GetActiveAttributesForFiltersUseCase {
  constructor(private readonly attributeRepository: PrismaAttributeRepository) {}

  async execute(): Promise<Attribute[]> {
    return this.attributeRepository.findAll();
  }
}
