import { IReturnRequestRepository } from '@domain/repositories/IReturnRequestRepository';
import { ReturnRequest } from '@domain/entities/ReturnRequest';

export class RejectReturnRequestUseCase {
  constructor(private readonly returnRequestRepository: IReturnRequestRepository) {}

  async execute(id: number): Promise<ReturnRequest> {
    const returnRequest = await this.returnRequestRepository.findById(id);
    if (!returnRequest) {
      throw new Error(`Return request with ID ${id} not found`);
    }

    if (returnRequest.status !== 'PENDING') {
      throw new Error(`Return request is already ${returnRequest.status}`);
    }

    return await this.returnRequestRepository.updateStatus(id, 'REJECTED');
  }
}
