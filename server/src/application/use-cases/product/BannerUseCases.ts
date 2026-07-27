import { IBannerRepository, CreateBannerDTO, UpdateBannerDTO } from '@domain/repositories/IBannerRepository';
import { Banner } from '@domain/entities/Banner';

export class GetActiveBannersUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(): Promise<Banner[]> {
    return this.bannerRepository.findAllActiveOrdered();
  }
}

export class GetAllBannersUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(): Promise<Banner[]> {
    return this.bannerRepository.findAll();
  }
}

export class CreateBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(dto: CreateBannerDTO): Promise<Banner> {
    return this.bannerRepository.create(dto);
  }
}

export class UpdateBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(id: number, dto: UpdateBannerDTO): Promise<Banner> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new Error(`El banner con ID ${id} no existe`);
    }
    return this.bannerRepository.update(id, dto);
  }
}

export class DeleteBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(id: number): Promise<void> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new Error(`El banner con ID ${id} no existe`);
    }
    return this.bannerRepository.delete(id);
  }
}

export class ReorderBannersUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}
  async execute(orders: { id: number; order: number }[]): Promise<void> {
    await Promise.all(
      orders.map((o) => this.bannerRepository.updateOrder(o.id, o.order))
    );
  }
}
