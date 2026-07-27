import { PrismaClient, CouponType } from '@prisma/client';

interface GetAdminCouponsDTO {
  page: number;
  limit: number;
  isActive?: boolean;
}

export class GetAdminCouponsUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(dto: GetAdminCouponsDTO) {
    const { page, limit, isActive } = dto;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await this.prisma.coupon.count({ where });

    const coupons = await this.prisma.coupon.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        specificProduct: {
          select: { name: true },
        },
        specificCategory: {
          select: { name: true },
        },
      },
    });

    return {
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
