import { Injectable } from "@nestjs/common";
import type { CouponDiscountType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const COUPON_SORT_FIELDS = ["createdAt", "code", "usedCount", "expiresAt"] as const;

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMerchantList(filter: {
    merchantId: string;
    search?: string;
    isActive?: boolean;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where = {
      merchantId: filter.merchantId,
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search ? { code: { contains: filter.search, mode: "insensitive" as const } } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, COUPON_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.coupon.count({ where }),
    ]);
    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  findByCode(code: string) {
    return this.prisma.coupon.findFirst({ where: { code: { equals: code, mode: "insensitive" } } });
  }

  create(data: {
    merchantId: string;
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderValue?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    isActive: boolean;
    startsAt?: Date;
    expiresAt?: Date;
  }) {
    return this.prisma.coupon.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      code: string;
      discountType: CouponDiscountType;
      discountValue: number;
      maxDiscountAmount: number | null;
      minOrderValue: number | null;
      usageLimit: number | null;
      perCustomerLimit: number | null;
      isActive: boolean;
      startsAt: Date | null;
      expiresAt: Date | null;
    }>,
  ) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  countCustomerRedemptions(couponId: string, customerId: string): Promise<number> {
    return this.prisma.couponRedemption.count({ where: { couponId, customerId } });
  }
}
