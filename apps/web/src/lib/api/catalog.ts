import { fetchPublic, fetchPublicEnvelope } from "../api-server";
import type {
  Brand,
  Category,
  CategoryNode,
  PaginatedResult,
  ProductDetail,
  ProductListItem,
} from "../../types/catalog";

export interface ProductListParams {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  attributeValueIds?: string[];
  page?: number;
  limit?: number;
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getProducts(params: ProductListParams = {}): Promise<PaginatedResult<ProductListItem>> {
  const qs = toQueryString({
    categoryId: params.categoryId,
    brandId: params.brandId,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    search: params.search,
    isFeatured: params.isFeatured,
    attributeValueIds: params.attributeValueIds?.join(","),
    page: params.page,
    limit: params.limit,
  });
  const { data, meta } = await fetchPublicEnvelope<ProductListItem[]>(`/products${qs}`);
  return {
    data,
    meta: meta ?? { page: 1, limit: data.length, totalItems: data.length, totalPages: 1 },
  };
}

export function getProductBySlug(slug: string): Promise<ProductDetail> {
  return fetchPublic<ProductDetail>(`/products/${slug}`);
}

export function getCategories(flat = false): Promise<CategoryNode[] | Category[]> {
  return fetchPublic(`/categories${flat ? "?flat=true" : ""}`);
}

export function getCategoryBySlug(slug: string): Promise<Category> {
  return fetchPublic<Category>(`/categories/${slug}`);
}

export function getBrands(): Promise<Brand[]> {
  return fetchPublic<Brand[]>("/brands");
}

export function getBrandBySlug(slug: string): Promise<Brand> {
  return fetchPublic<Brand>(`/brands/${slug}`);
}
