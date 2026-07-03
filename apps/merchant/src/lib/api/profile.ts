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

export async function listCategories() {
  const res = await apiClient.get("/categories", { params: { limit: 200 } });
  return res.data.data as Array<{ id: string; name: string }>;
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
