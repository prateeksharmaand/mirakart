import { apiClient } from "../api-client";

// ---------- Categories ----------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  imageMedia?: { url: string } | null;
  createdAt: string;
}

export async function listCategories(params: { page?: number; limit?: number; search?: string; parentId?: string } = {}) {
  const res = await apiClient.get("/categories", { params });
  return res.data as { data: Category[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getCategory(id: string): Promise<Category> {
  const res = await apiClient.get(`/categories/${id}`);
  return res.data.data as Category;
}

export async function createCategory(data: { name: string; description?: string; parentId?: string; isActive?: boolean }): Promise<Category> {
  const res = await apiClient.post("/categories", data);
  return res.data.data as Category;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; parentId?: string; isActive?: boolean }): Promise<Category> {
  const res = await apiClient.patch(`/categories/${id}`, data);
  return res.data.data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

// ---------- Brands ----------

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoMedia?: { url: string } | null;
  createdAt: string;
}

export async function listBrands(params: { page?: number; limit?: number; search?: string } = {}) {
  const res = await apiClient.get("/brands", { params });
  return res.data as { data: Brand[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getBrand(id: string): Promise<Brand> {
  const res = await apiClient.get(`/brands/${id}`);
  return res.data.data as Brand;
}

export async function createBrand(data: { name: string; isActive?: boolean }): Promise<Brand> {
  const res = await apiClient.post("/brands", data);
  return res.data.data as Brand;
}

export async function updateBrand(id: string, data: { name?: string; isActive?: boolean }): Promise<Brand> {
  const res = await apiClient.patch(`/brands/${id}`, data);
  return res.data.data as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await apiClient.delete(`/brands/${id}`);
}

// ---------- Attributes ----------

export interface AttributeValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface Attribute {
  id: string;
  name: string;
  type: string;
  values: AttributeValue[];
  createdAt: string;
}

export async function listAttributes(params: { page?: number; limit?: number; search?: string } = {}) {
  const res = await apiClient.get("/attributes", { params });
  return res.data as { data: Attribute[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getAttribute(id: string): Promise<Attribute> {
  const res = await apiClient.get(`/attributes/${id}`);
  return res.data.data as Attribute;
}

export async function createAttribute(data: { name: string; type: string; values?: string[] }): Promise<Attribute> {
  const res = await apiClient.post("/attributes", data);
  return res.data.data as Attribute;
}

export async function updateAttribute(id: string, data: { name?: string; values?: string[] }): Promise<Attribute> {
  const res = await apiClient.patch(`/attributes/${id}`, data);
  return res.data.data as Attribute;
}

export async function deleteAttribute(id: string): Promise<void> {
  await apiClient.delete(`/attributes/${id}`);
}
