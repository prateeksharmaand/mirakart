import { apiClient } from "../api-client";

export interface MerchantSalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalReturns: number;
}

export interface TopProduct {
  product: { id: string; name: string; slug: string } | null;
  unitsSold: number;
  revenue: number;
}

export async function getMerchantSalesSummary(params: { dateFrom?: string; dateTo?: string } = {}): Promise<MerchantSalesSummary> {
  const res = await apiClient.get("/merchants/me/reports/sales-summary", { params });
  return res.data.data as MerchantSalesSummary;
}

export async function getMerchantTopProducts(params: { dateFrom?: string; dateTo?: string; limit?: number } = {}): Promise<TopProduct[]> {
  const res = await apiClient.get("/merchants/me/reports/top-products", { params });
  return res.data.data as TopProduct[];
}

export interface OrderStatusSummary {
  pending: number;
  processing: number;
  packed: number;
  shipped: number;
}

export async function getOrderStatusSummary(): Promise<OrderStatusSummary> {
  const res = await apiClient.get("/merchants/me/reports/order-status-summary");
  return res.data.data as OrderStatusSummary;
}

export interface StockSummary {
  lowStockCount: number;
  outOfStockCount: number;
}

export async function getStockSummary(): Promise<StockSummary> {
  const res = await apiClient.get("/merchants/me/reports/stock-summary");
  return res.data.data as StockSummary;
}
