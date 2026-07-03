import { apiClient } from "../api-client";

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory?: { quantity: number } | null;
  attributeValues?: Array<{ attributeValue: { value: string; attribute: { name: string } } }>;
}

export interface ProductImage {
  id: string;
  sortOrder: number;
  isPrimary: boolean;
  media: { id: string; url: string };
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
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags?: Array<{ tag: { id: string; name: string; slug: string } }>;
}

export async function listMerchantProducts(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const res = await apiClient.get("/merchants/me/products", { params });
  return res.data as { data: Product[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getMerchantProduct(id: string): Promise<Product> {
  const res = await apiClient.get(`/merchants/me/products/${id}`);
  return res.data.data as Product;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  basePrice: number;
  compareAtPrice?: number;
  sku?: string;
  status?: string;
  tagIds?: string[];
}): Promise<Product> {
  const res = await apiClient.post("/merchants/me/products", data);
  return res.data.data as Product;
}

export async function addVariant(productId: string, data: {
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributeValueIds: string[];
}): Promise<ProductVariant> {
  const res = await apiClient.post(`/merchants/me/products/${productId}/variants`, data);
  return res.data.data as ProductVariant;
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  compareAtPrice: number;
  status: string;
  tagIds: string[];
}>): Promise<Product> {
  const res = await apiClient.patch(`/merchants/me/products/${id}`, data);
  return res.data.data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/merchants/me/products/${id}`);
}

export async function updateVariantInventory(productId: string, variantId: string, quantity: number): Promise<void> {
  await apiClient.patch(`/merchants/me/products/${productId}/variants/${variantId}/inventory`, { quantity });
}

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  const res = await apiClient.get(`/merchants/me/products/${productId}/images`);
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
  const res = await apiClient.post(`/merchants/me/products/${productId}/images`, { mediaId, isPrimary });
  return res.data.data as ProductImage;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/merchants/me/products/${productId}/images/${imageId}`);
}

export async function setProductImagePrimary(productId: string, imageId: string): Promise<void> {
  await apiClient.patch(`/merchants/me/products/${productId}/images/${imageId}/primary`);
}

export async function reorderProductImages(productId: string, items: { id: string; sortOrder: number }[]): Promise<void> {
  await apiClient.patch(`/merchants/me/products/${productId}/images/reorder`, { items });
}
