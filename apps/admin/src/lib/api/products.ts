import { apiClient } from "../api-client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  status: string;
  price: number;
  comparePrice?: number | null;
  createdAt: string;
  merchant?: { id: string; storeName: string } | null;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  images?: Array<{ id: string; media: { url: string } }>;
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  merchantId?: string;
  categoryId?: string;
} = {}) {
  const res = await apiClient.get("/products", { params });
  return res.data as { data: Product[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get(`/products/${id}`);
  return res.data.data as Product;
}

export async function updateProductStatus(id: string, status: string): Promise<Product> {
  const res = await apiClient.patch(`/products/${id}/status`, { status });
  return res.data.data as Product;
}
