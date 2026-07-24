export interface Media {
  id: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  iconMedia: Media | null;
  bannerMedia: Media | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoMedia: Media | null;
  isActive: boolean;
}

export interface AttributeValue {
  id: string;
  value: string;
  colorHex: string | null;
  attribute: { id: string; name: string; slug: string; type: "SELECT" | "COLOR" | "TEXT" };
}

export interface ProductAttributeValueLink {
  attributeValue: AttributeValue;
}

export interface Inventory {
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  isDefault: boolean;
  attributeValues: ProductAttributeValueLink[];
  inventory: Inventory | null;
}

export interface ProductImage {
  id: string;
  variantId: string | null;
  isPrimary: boolean;
  sortOrder: number;
  media: Media;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ProductTag {
  tag: Tag;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  basePrice: string;
  compareAtPrice: string | null;
  isFeatured: boolean;
  images: ProductImage[];
  brand: Brand | null;
  averageRating: number;
  reviewCount: number;
  // Only populated by list endpoints (findPublicList) — undefined on
  // ProductDetail, which derives stock per-variant from `variants` instead.
  availableCount?: number;
  variantCount?: number;
  singleVariantId?: string | null;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  sku: string | null;
  category: Category;
  variants: ProductVariant[];
  tags: ProductTag[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
