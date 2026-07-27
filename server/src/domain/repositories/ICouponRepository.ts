import { Coupon } from '../entities/Coupon';

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  incrementUsedCount(id: number): Promise<void>;
}
