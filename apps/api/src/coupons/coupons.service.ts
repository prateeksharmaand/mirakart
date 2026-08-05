import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Coupon } from "@prisma/client";
import { CouponsRepository } from "./coupons.repository";
import type { CouponQueryDto } from "./dto/coupon-query.dto";
import type { CreateCouponDto } from "./dto/create-coupon.dto";
import type { UpdateCouponDto } from "./dto/update-coupon.dto";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

export interface CartLineForPricing {
  merchantId: string;
  unitPrice: number;
  quantity: number;
}

export interface CouponPricingResult {
  coupon: Coupon;
  discountAmount: number;
  qualifyingMerchantId: string;
}

@Injectable()
export class CouponsService {
  constructor(private readonly repo: CouponsRepository) {}

  async listForMerchant(merchantId: string, query: CouponQueryDto) {
    const { items, totalItems } = await this.repo.findMerchantList({
      merchantId,
      search: query.search,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findOwned(id: string, merchantId: string) {
    const coupon = await this.repo.findById(id);
    if (!coupon || coupon.merchantId !== merchantId) {
      throw new NotFoundException("Coupon not found");
    }
    return coupon;
  }

  async create(merchantId: string, dto: CreateCouponDto) {
    this.assertValidDiscount(dto.discountType, dto.discountValue);
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException("This coupon code is already in use");

    return this.repo.create({
      merchantId,
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount,
      minOrderValue: dto.minOrderValue,
      usageLimit: dto.usageLimit,
      perCustomerLimit: dto.perCustomerLimit,
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async update(id: string, merchantId: string, dto: UpdateCouponDto) {
    const coupon = await this.findOwned(id, merchantId);
    this.assertValidDiscount(dto.discountType ?? coupon.discountType, dto.discountValue ?? Number(coupon.discountValue));

    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing && existing.id !== id) throw new ConflictException("This coupon code is already in use");
    }

    return this.repo.update(id, {
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount,
      minOrderValue: dto.minOrderValue,
      usageLimit: dto.usageLimit,
      perCustomerLimit: dto.perCustomerLimit,
      isActive: dto.isActive,
      startsAt: dto.startsAt === undefined ? undefined : dto.startsAt === null ? null : new Date(dto.startsAt),
      expiresAt: dto.expiresAt === undefined ? undefined : dto.expiresAt === null ? null : new Date(dto.expiresAt),
    });
  }

  /**
   * Validates a coupon code against a cart/checkout's line items and prices
   * the discount — the single source of truth reused by both the cart
   * "apply coupon" endpoint (live preview) and checkout (final,
   * authoritative re-validation). Never trust a previously-applied flag —
   * always re-run this at the moment it actually matters.
   *
   * A coupon only ever discounts its owning merchant's lines: `lines` from
   * every other merchant in the same cart are ignored entirely, never
   * discounted.
   */
  async priceCartForCoupon(
    lines: CartLineForPricing[],
    code: string,
    customerId: string,
  ): Promise<CouponPricingResult> {
    const coupon = await this.repo.findByCode(code);
    if (!coupon) throw new BadRequestException("Invalid coupon code");
    if (!coupon.isActive) throw new BadRequestException("This coupon is no longer active");

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException("This coupon is not active yet");
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException("This coupon has expired");
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("This coupon has reached its usage limit");
    }
    if (coupon.perCustomerLimit !== null) {
      const used = await this.repo.countCustomerRedemptions(coupon.id, customerId);
      if (used >= coupon.perCustomerLimit) {
        throw new BadRequestException("You've already used this coupon the maximum number of times");
      }
    }

    const qualifyingLines = lines.filter((line) => line.merchantId === coupon.merchantId);
    if (qualifyingLines.length === 0) {
      throw new BadRequestException("This coupon doesn't apply to any items in your cart");
    }
    const qualifyingSubtotal = qualifyingLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    if (coupon.minOrderValue !== null && qualifyingSubtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Add ₹${(Number(coupon.minOrderValue) - qualifyingSubtotal).toFixed(2)} more from this seller to use this coupon`,
      );
    }

    let rawDiscount =
      coupon.discountType === "PERCENTAGE" ? qualifyingSubtotal * (Number(coupon.discountValue) / 100) : Number(coupon.discountValue);
    if (coupon.maxDiscountAmount !== null) {
      rawDiscount = Math.min(rawDiscount, Number(coupon.maxDiscountAmount));
    }
    const discountAmount = Math.round(Math.min(rawDiscount, qualifyingSubtotal) * 100) / 100;

    return { coupon, discountAmount, qualifyingMerchantId: coupon.merchantId };
  }

  private assertValidDiscount(discountType: string, discountValue: number) {
    if (discountType === "PERCENTAGE" && discountValue > 100) {
      throw new BadRequestException("A percentage discount cannot exceed 100");
    }
  }
}
