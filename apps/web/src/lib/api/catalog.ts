import { fetchPublic, fetchPublicEnvelope } from "../api-server";
import type {
  Brand,
  Category,
  CategoryNode,
  PaginatedResult,
  ProductDetail,
  ProductListItem,
} from "../../types/catalog";

export interface AttributeOption {
  id: string;
  value: string;
  colorHex: string | null;
  sortOrder: number;
}

export interface AttributeFilter {
  id: string;
  name: string;
  slug: string;
  type: "SELECT" | "COLOR" | "TEXT";
  values: AttributeOption[];
}

export interface ProductListParams {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  attributeValueIds?: string[];
  tagSlug?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
    tagSlug: params.tagSlug,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
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

export function getBrands(limit?: number): Promise<Brand[]> {
  return fetchPublic<Brand[]>(`/brands${limit ? `?limit=${limit}` : ""}`);
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export function getTags(): Promise<Tag[]> {
  return fetchPublic<Tag[]>("/tags");
}

export function getBrandBySlug(slug: string): Promise<Brand> {
  return fetchPublic<Brand>(`/brands/${slug}`);
}

export function getAttributes(): Promise<AttributeFilter[]> {
  return fetchPublic<AttributeFilter[]>("/attributes");
}

export interface PriceRange {
  min: number;
  max: number;
}

export function getPriceRange(
  params: Pick<ProductListParams, "categoryId" | "brandId" | "search" | "isFeatured" | "attributeValueIds" | "tagSlug"> = {},
): Promise<PriceRange> {
  const qs = toQueryString({
    categoryId: params.categoryId,
    brandId: params.brandId,
    search: params.search,
    isFeatured: params.isFeatured,
    attributeValueIds: params.attributeValueIds?.join(","),
    tagSlug: params.tagSlug,
  });
  return fetchPublic<PriceRange>(`/products/price-range${qs}`);
}
