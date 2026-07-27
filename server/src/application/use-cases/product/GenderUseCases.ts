import { IGenderRepository } from '@domain/repositories/IGenderRepository';
import { Gender, CreateGenderDTO, UpdateGenderDTO } from '@domain/entities/Gender';

export class GetAllGendersUseCase {
  constructor(private readonly genderRepository: IGenderRepository) {}
  async execute(): Promise<Gender[]> {
    return this.genderRepository.findAll();
  }
}

export class GetActiveGendersUseCase {
  constructor(private readonly genderRepository: IGenderRepository) {}
  async execute(): Promise<Gender[]> {
    return this.genderRepository.findAllActive();
  }
}

export class CreateGenderUseCase {
  constructor(private readonly genderRepository: IGenderRepository) {}
  async execute(dto: CreateGenderDTO): Promise<Gender> {
    return this.genderRepository.create(dto);
  }
}

export class UpdateGenderUseCase {
  constructor(private readonly genderRepository: IGenderRepository) {}
  async execute(id: number, dto: UpdateGenderDTO): Promise<Gender> {
    const gender = await this.genderRepository.findById(id);
    if (!gender) {
      throw new Error(`El género con ID ${id} no existe`);
    }
    return this.genderRepository.update(id, dto);
  }
}

export class DeleteGenderUseCase {
  constructor(private readonly genderRepository: IGenderRepository) {}
  async execute(id: number): Promise<void> {
    const gender = await this.genderRepository.findById(id);
    if (!gender) {
      throw new Error(`El género con ID ${id} no existe`);
    }
    return this.genderRepository.delete(id);
  }
}
