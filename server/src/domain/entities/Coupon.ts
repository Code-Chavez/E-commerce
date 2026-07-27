export enum CouponType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export class Coupon {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly type: CouponType,
    public readonly value: number,
    public readonly usedCount: number,
    public readonly isActive: boolean,
    public readonly expiresAt: Date | null,
    public readonly maxUses: number | null,
    public readonly userId: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
