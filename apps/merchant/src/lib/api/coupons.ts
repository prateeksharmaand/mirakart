import { apiClient } from "../api-client";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export async function listCoupons(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {},
): Promise<{ data: Coupon[]; meta: ListMeta }> {
  const res = await apiClient.get("/merchants/me/coupons", { params });
  return res.data as { data: Coupon[]; meta: ListMeta };
}

export async function getCoupon(id: string): Promise<Coupon> {
  const res = await apiClient.get(`/merchants/me/coupons/${id}`);
  return res.data.data as Coupon;
}

export interface CouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
}

export async function createCoupon(data: CouponInput): Promise<Coupon> {
  const res = await apiClient.post("/merchants/me/coupons", data);
  return res.data.data as Coupon;
}

export interface CouponUpdateInput {
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export async function updateCoupon(id: string, data: CouponUpdateInput): Promise<Coupon> {
  const res = await apiClient.patch(`/merchants/me/coupons/${id}`, data);
  return res.data.data as Coupon;
}
