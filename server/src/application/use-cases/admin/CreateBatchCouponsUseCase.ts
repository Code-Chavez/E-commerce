import { PrismaClient, CouponType } from '@prisma/client';

interface CreateBatchCouponsDTO {
  prefix: string;
  quantity: number;
  type: CouponType;
  value: number;
  minPurchaseAmount?: number;
  specificProductId?: number;
  specificCategoryId?: number;
  expiresAt?: Date;
  maxUses?: number;
}

export class CreateBatchCouponsUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(data: CreateBatchCouponsDTO) {
    const {
      prefix,
      quantity,
      type,
      value,
      minPurchaseAmount,
      specificProductId,
      specificCategoryId,
      expiresAt,
      maxUses,
    } = data;

    if (quantity <= 0 || quantity > 500) {
      throw new Error('Quantity must be between 1 and 500');
    }

    const couponsToCreate = [];
    for (let i = 0; i < quantity; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${prefix}-${randomSuffix}`;
      
      couponsToCreate.push({
        code,
        type,
        value,
        minPurchaseAmount,
        specificProductId,
        specificCategoryId,
        expiresAt,
        maxUses,
      });
    }

    const result = await this.prisma.coupon.createMany({
      data: couponsToCreate,
      skipDuplicates: true,
    });

    return {
      success: true,
      count: result.count,
      message: `Created ${result.count} coupons successfully.`,
    };
  }
}
