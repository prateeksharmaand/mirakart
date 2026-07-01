import { apiClient } from "../api-client";

export interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalReturns: number;
}

export interface TopProduct {
  product: { id: string; name: string; slug: string } | null;
  unitsSold: number;
  revenue: number;
}

export async function getAdminSalesSummary(params: { dateFrom?: string; dateTo?: string } = {}): Promise<SalesSummary> {
  const res = await apiClient.get("/admin/reports/sales-summary", { params });
  return res.data.data as SalesSummary;
}

export async function getTopProducts(params: { dateFrom?: string; dateTo?: string; limit?: number } = {}): Promise<TopProduct[]> {
  const res = await apiClient.get("/admin/reports/top-products", { params });
  return res.data.data as TopProduct[];
}

export async function getMerchantCount(): Promise<number> {
  const res = await apiClient.get("/merchants", { params: { limit: 1 } });
  return (res.data.meta?.totalItems ?? 0) as number;
}

export async function getCustomerCount(): Promise<number> {
  const res = await apiClient.get("/customers", { params: { limit: 1 } });
  return (res.data.meta?.totalItems ?? 0) as number;
}
