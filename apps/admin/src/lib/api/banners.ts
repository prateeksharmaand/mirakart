import { apiClient } from "../api-client";

export interface Banner {
  id: string;
  title?: string | null;
  linkUrl?: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  media?: { id: string; url: string } | null;
}

export async function listBanners(params: { position?: string; isActive?: boolean } = {}) {
  const res = await apiClient.get("/banners", { params });
  return res.data.data as Banner[];
}

export async function getBanner(id: string): Promise<Banner> {
  const res = await apiClient.get(`/banners/${id}`);
  return res.data.data as Banner;
}

export async function createBanner(data: {
  title?: string;
  linkUrl?: string;
  position: string;
  sortOrder?: number;
  isActive?: boolean;
  mediaId: string;
}): Promise<Banner> {
  const res = await apiClient.post("/banners", data);
  return res.data.data as Banner;
}

export async function updateBanner(
  id: string,
  data: { title?: string; linkUrl?: string; sortOrder?: number; isActive?: boolean },
): Promise<Banner> {
  const res = await apiClient.patch(`/banners/${id}`, data);
  return res.data.data as Banner;
}

export async function deleteBanner(id: string): Promise<void> {
  await apiClient.delete(`/banners/${id}`);
}
