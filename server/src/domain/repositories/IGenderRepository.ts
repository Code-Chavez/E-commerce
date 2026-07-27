import { Gender, CreateGenderDTO, UpdateGenderDTO } from '../entities/Gender';

export interface IGenderRepository {
  findById(id: number): Promise<Gender | null>;
  findAll(): Promise<Gender[]>;
  findAllActive(): Promise<Gender[]>;
  create(data: CreateGenderDTO): Promise<Gender>;
  update(id: number, data: UpdateGenderDTO): Promise<Gender>;
  delete(id: number): Promise<void>;
}
