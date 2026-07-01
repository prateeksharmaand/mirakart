import { fetchPublic } from "../api-server";
import type { Media } from "../../types/catalog";

export interface Banner {
  id: string;
  title: string;
  linkUrl: string | null;
  position: "HOME_HERO" | "HOME_SECONDARY" | "CATEGORY_TOP" | "STOREFRONT_TOP";
  media: Media;
}

export function getBanners(position: Banner["position"]): Promise<Banner[]> {
  return fetchPublic<Banner[]>(`/banners?position=${position}`);
}
