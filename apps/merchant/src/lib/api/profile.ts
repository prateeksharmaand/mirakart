import { apiClient } from "../api-client";
import type { MerchantProfile } from "../../stores/auth-store";

export async function getMerchantProfile(): Promise<MerchantProfile> {
  const res = await apiClient.get("/merchants/me");
  return res.data.data as MerchantProfile;
}

export async function updateMerchantProfile(data: {
  storeName?: string;
  phone?: string;
  description?: string;
  address?: string;
}): Promise<MerchantProfile> {
  const res = await apiClient.patch("/merchants/me", data);
  return res.data.data as MerchantProfile;
}

export interface MerchantDocument {
  id: string;
  type: string;
  status: string;
  rejectionReason?: string | null;
  media?: { url: string } | null;
}

export async function listMyDocuments(): Promise<MerchantDocument[]> {
  const res = await apiClient.get("/merchants/me/documents");
  return res.data.data as MerchantDocument[];
}

export async function uploadDocument(data: { type: string; mediaId: string }): Promise<MerchantDocument> {
  const res = await apiClient.post("/merchants/me/documents", data);
  return res.data.data as MerchantDocument;
}

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
  /** Nesting depth (0 = top-level) — use to indent in a flat <Select>. */
  depth: number;
}

export async function listCategories(): Promise<CategoryOption[]> {
  const res = await apiClient.get("/categories", { params: { flat: "true" } });
  const flat = res.data.data as Array<{ id: string; name: string; parentId?: string | null }>;
  return buildCategoryOptions(flat);
}

// Orders a flat category list into parent-then-children (depth-first) so a
// plain <Select> can show subcategories indented under their parent instead
// of only ever listing top-level categories.
function buildCategoryOptions(flat: Array<{ id: string; name: string; parentId?: string | null }>): CategoryOption[] {
  const byParent = new Map<string | null, typeof flat>();
  for (const cat of flat) {
    const key = cat.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }
  const result: CategoryOption[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const cat of byParent.get(parentId) ?? []) {
      result.push({ id: cat.id, name: cat.name, parentId: cat.parentId ?? null, depth });
      walk(cat.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

export async function listBrands() {
  const res = await apiClient.get("/brands", { params: { limit: 200 } });
  return res.data.data as Array<{ id: string; name: string }>;
}

export async function listActiveTags() {
  const res = await apiClient.get("/tags");
  return res.data.data as Array<{ id: string; name: string; slug: string }>;
}

export interface AttributeValue {
  id: string;
  value: string;
  colorHex: string | null;
  sortOrder: number;
}

export interface AttributeWithValues {
  id: string;
  name: string;
  slug: string;
  type: "SELECT" | "COLOR" | "TEXT";
  values: AttributeValue[];
}

export async function listAttributes(): Promise<AttributeWithValues[]> {
  const res = await apiClient.get("/attributes");
  return (res.data as { data: AttributeWithValues[] }).data;
}

export async function listCategoryAttributes(categoryId: string): Promise<AttributeWithValues[]> {
  const res = await apiClient.get(`/categories/${categoryId}/attributes`);
  const items = (res.data.data ?? []) as Array<{ attribute: AttributeWithValues }>;
  return items.map((ca) => ca.attribute);
}
