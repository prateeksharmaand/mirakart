import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterSidebar } from "../../components/filter-sidebar";
import { SortSelect } from "../../components/sort-select";
import { PageSizeSelect } from "../../components/page-size-select";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination";
import { parseSortParam } from "../../lib/sort";
import { ProductGrid } from "../../components/product-grid";
import { expandWithDescendants } from "../../lib/category-tree-utils";
import {
  getProducts,
  getAttributes,
  getBrands,
  getTags,
  getCategories,
  getPriceRange,
} from "../../lib/api/catalog";
import type { CategoryNode } from "../../types/catalog";

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
    categoryIds?: string;
    brandId?: string;
    limit?: string;
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
  const limit = searchParams.limit ? Number(searchParams.limit) : DEFAULT_PAGE_SIZE;

  const [attributes, brands, categoryTree, tags] = await Promise.all([
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    (getCategories(false) as Promise<CategoryNode[]>).catch(() => [] as CategoryNode[]),
    getTags().catch(() => []),
  ]);

  // Expand any checked categories to include their own subcategories, so a
  // category with no products tagged directly to it (all tagged to its
  // subcategories) doesn't appear empty.
  const rawIds = searchParams.categoryIds
    ? searchParams.categoryIds.split(",").filter(Boolean)
    : searchParams.categoryId
      ? [searchParams.categoryId]
      : [];
  const categoryIds = rawIds.length > 0 ? expandWithDescendants(categoryTree, rawIds) : undefined;

  const [result, priceBounds] = await Promise.all([
    getProducts({
      tagSlug: searchParams.tag,
      page,
      limit,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      search: searchParams.search || undefined,
      attributeValueIds,
      sortBy,
      sortOrder,
      categoryId: searchParams.categoryId || undefined,
      categoryIds,
      brandId: searchParams.brandId || undefined,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getPriceRange({
      tagSlug: searchParams.tag,
      search: searchParams.search || undefined,
      categoryId: searchParams.categoryId || undefined,
      categoryIds,
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
    categoryIds: searchParams.categoryIds,
    brandId: searchParams.brandId,
    limit: searchParams.limit,
  };
  const resultFrom = result.meta.totalItems === 0 ? 0 : (result.meta.page - 1) * result.meta.limit + 1;
  const resultTo = Math.min(result.meta.page * result.meta.limit, result.meta.totalItems);

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

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold capitalize text-foreground">{pageTitle}</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar — on mobile shows the drawer trigger button */}
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:scrollbar-thin">
          <Suspense fallback={null}>
            <FilterSidebar
              categoryTree={categoryTree}
              brands={brands}
              tags={tags}
              attributes={attributes}
              priceBounds={priceBounds}
            />
          </Suspense>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-5">
          {/* Results bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {result.meta.totalItems === 0
                ? "No results"
                : `Showing ${resultFrom}–${resultTo} of ${result.meta.totalItems} results`}
            </p>
            <div className="flex items-center gap-4">
              <Suspense fallback={null}>
                <PageSizeSelect currentLimit={result.meta.limit} />
              </Suspense>
              <Suspense fallback={null}>
                <SortSelect currentSort={searchParams.sort} />
              </Suspense>
            </div>
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
