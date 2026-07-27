import { ICouponRepository } from '../../../domain/repositories/ICouponRepository';
import { CouponType } from '../../../domain/entities/Coupon';

interface ValidateCouponRequest {
  code: string;
  subtotal: number;
}

interface ValidateCouponResponse {
  valid: boolean;
  discountAmount: number;
  message?: string;
}

export class ValidateCouponUseCase {
  constructor(private couponRepository: ICouponRepository) {}

  async execute(request: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const { code, subtotal } = request;
    
    const coupon = await this.couponRepository.findByCode(code.trim());

    if (!coupon) {
      return { valid: false, discountAmount: 0, message: 'El cupón no existe.' };
    }

    if (!coupon.isActive) {
      return { valid: false, discountAmount: 0, message: 'El cupón está inactivo.' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, discountAmount: 0, message: 'El cupón ha expirado.' };
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, discountAmount: 0, message: 'El cupón ha alcanzado su límite de usos.' };
    }

    let discountAmount = 0;
    if (coupon.type === CouponType.PERCENT) {
      discountAmount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === CouponType.FIXED) {
      discountAmount = coupon.value;
    }

    // Ensure we don't discount more than the subtotal itself
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      valid: true,
      discountAmount: Number(discountAmount.toFixed(2)),
      message: 'Cupón aplicado correctamente.',
    };
  }
}
