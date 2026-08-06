import { apiClient } from "../api-client";

export interface ProductImage {
  id: string;
  sortOrder: number;
  isPrimary: boolean;
  media: { url: string };
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory?: { quantity: number } | null;
  attributeValues?: Array<{ attributeValue: { value: string; attribute: { name: string } } }>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  description?: string | null;
  status: string;
  basePrice: number;
  compareAtPrice?: number | null;
  createdAt: string;
  merchant?: { id: string; storeName: string } | null;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  rejectionReason?: string | null;
  stockCount?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  merchantId?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const res = await apiClient.get("/admin/products", { params });
  return res.data as { data: Product[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get(`/admin/products/${id}`);
  return res.data.data as Product;
}

/** Trust & safety override — the only admin write left on products. */
export async function suspendProduct(id: string): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/suspend`);
}

/** Undoes suspendProduct() — a merchant can't self-reactivate a suspended product. */
export async function activateProduct(id: string): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/activate`);
}
