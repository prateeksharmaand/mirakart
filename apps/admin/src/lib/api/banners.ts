import { apiClient } from "../api-client";

export const BANNER_POSITIONS = [
  { value: "HOME_HERO", label: "Home Hero" },
  { value: "HOME_SECONDARY", label: "Home Secondary" },
  { value: "CATEGORY_TOP", label: "Category Top" },
  { value: "STOREFRONT_TOP", label: "Storefront Top" },
] as const;

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

export async function listBanners(): Promise<Banner[]> {
  const res = await apiClient.get("/admin/banners");
  return res.data.data as Banner[];
}

export async function getBanner(id: string): Promise<Banner> {
  const res = await apiClient.get(`/admin/banners/${id}`);
  return res.data.data as Banner;
}

export async function uploadBannerImage(file: Blob): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file, "banner.jpg");
  formData.append("purpose", "BANNERS");
  const res = await apiClient.post("/uploads", formData);
  return res.data.data as { id: string; url: string };
}

export async function createBanner(data: {
  title: string;
  mediaId: string;
  position: string;
  linkUrl?: string;
  sortOrder?: number;
}): Promise<Banner> {
  const res = await apiClient.post("/admin/banners", data);
  return res.data.data as Banner;
}

export async function updateBanner(
  id: string,
  data: {
    title?: string;
    mediaId?: string;
    linkUrl?: string | null;
    position?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<Banner> {
  const res = await apiClient.patch(`/admin/banners/${id}`, data);
  return res.data.data as Banner;
}

export async function deleteBanner(id: string): Promise<void> {
  await apiClient.delete(`/admin/banners/${id}`);
}
