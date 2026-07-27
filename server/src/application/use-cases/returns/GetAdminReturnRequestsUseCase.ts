import { IReturnRequestRepository } from '@domain/repositories/IReturnRequestRepository';
import { ReturnRequest } from '@domain/entities/ReturnRequest';

export class GetAdminReturnRequestsUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository
  ) {}

  async execute(): Promise<ReturnRequest[]> {
    // A simple pass-through to the repository to get all return requests for admin view
    return await this.returnRequestRepository.findAll();
  }
}
