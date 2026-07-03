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
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  merchantId?: string;
  categoryId?: string;
} = {}) {
  const res = await apiClient.get("/admin/products", { params });
  return res.data as { data: Product[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get(`/admin/products/${id}`);
  return res.data.data as Product;
}

export async function approveProduct(id: string): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/approve`);
}

export async function rejectProduct(id: string, rejectionReason: string): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/reject`, { rejectionReason });
}

export async function setFeatured(id: string, isFeatured: boolean): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/featured`, { isFeatured });
}

// --- Image management ---

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  const res = await apiClient.get(`/admin/products/${productId}/images`);
  return res.data.data as ProductImage[];
}

export async function uploadProductImage(file: Blob): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file, "image.jpg");
  formData.append("purpose", "PRODUCT_IMAGES");
  const res = await apiClient.post("/uploads", formData);
  return res.data.data as { id: string; url: string };
}

export async function addProductImage(productId: string, mediaId: string, isPrimary?: boolean): Promise<ProductImage> {
  const res = await apiClient.post(`/admin/products/${productId}/images`, { mediaId, isPrimary });
  return res.data.data as ProductImage;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
}

export async function setProductImagePrimary(productId: string, imageId: string): Promise<void> {
  await apiClient.patch(`/admin/products/${productId}/images/${imageId}/primary`);
}

export async function reorderProductImages(productId: string, items: { id: string; sortOrder: number }[]): Promise<void> {
  await apiClient.patch(`/admin/products/${productId}/images/reorder`, { items });
}
