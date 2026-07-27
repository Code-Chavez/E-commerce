import { PrismaClient, Coupon as PrismaCoupon } from '@prisma/client';
import { ICouponRepository } from '../../../domain/repositories/ICouponRepository';
import { Coupon, CouponType } from '../../../domain/entities/Coupon';

export class PrismaCouponRepository implements ICouponRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToDomain(prismaCoupon: PrismaCoupon): Coupon {
    return new Coupon(
      prismaCoupon.id,
      prismaCoupon.code,
      prismaCoupon.type as CouponType,
      prismaCoupon.value.toNumber(),
      prismaCoupon.usedCount,
      prismaCoupon.isActive,
      prismaCoupon.expiresAt,
      prismaCoupon.maxUses,
      prismaCoupon.userId,
      prismaCoupon.createdAt,
      prismaCoupon.updatedAt
    );
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) return null;
    return this.mapToDomain(coupon);
  }

  async incrementUsedCount(id: number): Promise<void> {
    await this.prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }
}
