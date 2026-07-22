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
  iconMedia?: { id: string; url: string } | null;
  bannerMedia?: { id: string; url: string } | null;
  createdAt: string;
}

export async function getCategory(id: string): Promise<Category> {
  const res = await apiClient.get(`/categories/admin/${id}`);
  return res.data.data as Category;
}

export async function listCategoriesForAdmin(): Promise<Category[]> {
  const res = await apiClient.get("/categories/admin/all");
  return res.data.data as Category[];
}

export async function uploadCategoryImage(file: Blob): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file, "image.jpg");
  formData.append("purpose", "CATEGORY_MEDIA");
  const res = await apiClient.post("/uploads", formData);
  return res.data.data as { id: string; url: string };
}

export async function createCategory(data: {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  iconMediaId?: string;
  bannerMediaId?: string;
}): Promise<Category> {
  const res = await apiClient.post("/categories", data);
  return res.data.data as Category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
    iconMediaId?: string;
    bannerMediaId?: string;
  },
): Promise<Category> {
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
  code: string | null;
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

export async function createBrand(data: { name: string; code?: string; isActive?: boolean }): Promise<Brand> {
  const res = await apiClient.post("/brands", data);
  return res.data.data as Brand;
}

export async function updateBrand(id: string, data: { name?: string; code?: string; isActive?: boolean }): Promise<Brand> {
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
  colorHex: string | null;
  sortOrder: number;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: "SELECT" | "COLOR" | "TEXT";
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

export async function createAttribute(data: {
  name: string;
  type: string;
  values: Array<{ value: string; colorHex?: string }>;
}): Promise<Attribute> {
  const res = await apiClient.post("/attributes", data);
  return res.data.data as Attribute;
}

export async function updateAttribute(id: string, data: { name?: string; type?: string }): Promise<Attribute> {
  const res = await apiClient.patch(`/attributes/${id}`, data);
  return res.data.data as Attribute;
}

export async function addAttributeValue(
  attributeId: string,
  data: { value: string; colorHex?: string },
): Promise<AttributeValue> {
  const res = await apiClient.post(`/attributes/${attributeId}/values`, data);
  return res.data.data as AttributeValue;
}

export async function deleteAttributeValue(attributeId: string, valueId: string): Promise<void> {
  await apiClient.delete(`/attributes/${attributeId}/values/${valueId}`);
}

export async function deleteAttribute(id: string): Promise<void> {
  await apiClient.delete(`/attributes/${id}`);
}

// ---------- Tags ----------

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export async function listTags(params: { page?: number; limit?: number; search?: string; isActive?: boolean } = {}) {
  const res = await apiClient.get("/tags/admin/all", { params });
  return res.data as { data: Tag[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getTag(id: string): Promise<Tag> {
  const res = await apiClient.get(`/tags/${id}`);
  return res.data.data as Tag;
}

export async function createTag(data: { name: string; description?: string; isActive?: boolean; sortOrder?: number }): Promise<Tag> {
  const res = await apiClient.post("/tags", data);
  return res.data.data as Tag;
}

export async function updateTag(id: string, data: { name?: string; description?: string; isActive?: boolean; sortOrder?: number }): Promise<Tag> {
  const res = await apiClient.patch(`/tags/${id}`, data);
  return res.data.data as Tag;
}

export async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/tags/${id}`);
}

// ---------- Category Attributes ----------

export interface CategoryAttributeItem {
  id: string;
  categoryId: string;
  attributeId: string;
  attribute: Attribute;
  sortOrder: number;
  isRequired: boolean;
}

export async function getCategoryAttributes(categoryId: string): Promise<CategoryAttributeItem[]> {
  const res = await apiClient.get(`/categories/${categoryId}/attributes`);
  return res.data.data as CategoryAttributeItem[];
}

export async function assignCategoryAttribute(
  categoryId: string,
  data: { attributeId: string; sortOrder?: number; isRequired?: boolean },
): Promise<CategoryAttributeItem> {
  const res = await apiClient.post(`/categories/${categoryId}/attributes`, data);
  return res.data.data as CategoryAttributeItem;
}

export async function removeCategoryAttribute(categoryId: string, attributeId: string): Promise<void> {
  await apiClient.delete(`/categories/${categoryId}/attributes/${attributeId}`);
}
