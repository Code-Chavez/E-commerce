import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '@domain/entities/Employee';

export interface IEmployeeRepository {
  findById(id: number): Promise<Employee | null>;
  findByDni(dni: string): Promise<Employee | null>;
  findAll(params: { page: number; limit: number; search?: string }): Promise<{ items: Employee[]; total: number }>;
  create(data: CreateEmployeeDTO): Promise<Employee>;
  update(id: number, data: UpdateEmployeeDTO): Promise<Employee>;
  toggleStatus(id: number, isActive: boolean): Promise<void>;
}
