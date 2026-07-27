import { Delivery } from '@domain/entities/Delivery';
import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export class AssignDeliveryManUseCase {
  constructor(
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(deliveryId: number, deliveryManId: number): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const user = await this.userRepository.findById(deliveryManId);
    if (!user) {
      throw new Error('Delivery man user not found');
    }

    // Verify if the user has the 'DELIVERY' role
    const hasDeliveryRole = user.roles?.includes('DELIVERY');
    if (!hasDeliveryRole) {
      throw new Error('User does not have the DELIVERY role');
    }

    return await this.deliveryRepository.assignDeliveryMan(deliveryId, deliveryManId);
  }
}
