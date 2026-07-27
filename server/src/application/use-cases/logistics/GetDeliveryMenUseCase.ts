import { IUserRepository } from '@domain/repositories/IUserRepository';

export class GetDeliveryMenUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<any[]> {
    const deliveryMen = await this.userRepository.findUsersByRoleName('DELIVERY');

    return deliveryMen.map((user) => ({
      id: user.id,
      name: [user.name, user.lastName].filter(Boolean).join(' ') || 'Sin Nombre',
      email: user.email,
    }));
  }
}
