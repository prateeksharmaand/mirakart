import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterSidebar } from "../../components/filter-sidebar";
import { SortSelect } from "../../components/sort-select";
import { parseSortParam } from "../../lib/sort";
import { ProductGrid } from "../../components/product-grid";
import {
  getProducts,
  getAttributes,
  getBrands,
  getTags,
  getCategories,
  getPriceRange,
} from "../../lib/api/catalog";
import type { Category } from "../../types/catalog";

interface PageProps {
  searchParams: {
    tag?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    av?: string;
    search?: string;
    sort?: string;
    categoryId?: string;
    brandId?: string;
  };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: searchParams.search
      ? `Search: ${searchParams.search}`
      : searchParams.tag
      ? `Tag: ${searchParams.tag}`
      : "All Products",
    description: "Browse our full product catalog",
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1);
  const attributeValueIds = searchParams.av
    ? searchParams.av.split(",").filter(Boolean)
    : undefined;
  const { sortBy, sortOrder } = parseSortParam(searchParams.sort);

  const [result, attributes, brands, categories, tags, priceBounds] = await Promise.all([
    getProducts({
      tagSlug: searchParams.tag,
      page,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      search: searchParams.search || undefined,
      attributeValueIds,
      sortBy,
      sortOrder,
      categoryId: searchParams.categoryId || undefined,
      brandId: searchParams.brandId || undefined,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    (getCategories(true) as Promise<Category[]>).catch(() => []),
    getTags().catch(() => []),
    getPriceRange({
      tagSlug: searchParams.tag,
      search: searchParams.search || undefined,
      categoryId: searchParams.categoryId || undefined,
      brandId: searchParams.brandId || undefined,
    }).catch(() => ({ min: 0, max: 0 })),
  ]);

  const pageTitle = searchParams.search
    ? `Results for "${searchParams.search}"`
    : searchParams.tag
    ? searchParams.tag.replace(/-/g, " ")
    : "All Products";

  const currentSearchParams = {
    tag: searchParams.tag,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    av: searchParams.av,
    search: searchParams.search,
    sort: searchParams.sort,
    categoryId: searchParams.categoryId,
    brandId: searchParams.brandId,
  };

  return (
    <div className="mx-auto max-w-site px-gutter py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="capitalize text-foreground">{pageTitle}</span>
      </nav>

      {/* Page title + count */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold capitalize text-foreground">{pageTitle}</h1>
        <p className="text-sm text-foreground-muted">
          {result.meta.totalItems}{" "}
          {result.meta.totalItems === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar — on mobile shows the drawer trigger button */}
        <aside>
          <Suspense fallback={null}>
            <FilterSidebar
              categories={categories}
              brands={brands}
              tags={tags}
              attributes={attributes}
              priceBounds={priceBounds}
            />
          </Suspense>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-5">
          {/* Sort bar */}
          <div className="flex items-center justify-end">
            <Suspense fallback={null}>
              <SortSelect currentSort={searchParams.sort} />
            </Suspense>
          </div>

          <ProductGrid
            result={result}
            basePath="/products"
            searchParams={currentSearchParams}
          />
        </div>
      </div>
    </div>
  );
}
