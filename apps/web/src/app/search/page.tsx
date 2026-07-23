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
import { getProducts, getAttributes, getBrands, getCategories, getTags, getPriceRange } from "../../lib/api/catalog";
import type { CategoryNode } from "../../types/catalog";

interface PageProps {
  searchParams: {
    q?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    av?: string;
    sort?: string;
    brandId?: string;
    tag?: string;
    categoryId?: string;
    categoryIds?: string;
    limit?: string;
  };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return { title: searchParams.q ? `Search: ${searchParams.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1);
  const { sortBy, sortOrder } = parseSortParam(searchParams.sort);
  const attributeValueIds = searchParams.av ? searchParams.av.split(",").filter(Boolean) : undefined;
  const limit = searchParams.limit ? Number(searchParams.limit) : DEFAULT_PAGE_SIZE;

  const [attributes, brands, tags, categoryTree] = await Promise.all([
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    getTags().catch(() => []),
    (getCategories(false) as Promise<CategoryNode[]>).catch(() => [] as CategoryNode[]),
  ]);

  const rawIds = searchParams.categoryIds
    ? searchParams.categoryIds.split(",").filter(Boolean)
    : searchParams.categoryId
      ? [searchParams.categoryId]
      : [];
  const categoryIds = rawIds.length > 0 ? expandWithDescendants(categoryTree, rawIds) : undefined;

  const [result, priceBounds] = await Promise.all([
    getProducts({
      search: searchParams.q,
      page,
      limit,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      attributeValueIds,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      categoryId: searchParams.categoryId || undefined,
      categoryIds,
      sortBy,
      sortOrder,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getPriceRange({
      search: searchParams.q,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      categoryId: searchParams.categoryId || undefined,
      categoryIds,
    }).catch(() => ({ min: 0, max: 0 })),
  ]);

  const currentSearchParams = {
    q: searchParams.q,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    av: searchParams.av,
    sort: searchParams.sort,
    brandId: searchParams.brandId,
    tag: searchParams.tag,
    categoryId: searchParams.categoryId,
    categoryIds: searchParams.categoryIds,
    limit: searchParams.limit,
  };
  const resultFrom = result.meta.totalItems === 0 ? 0 : (result.meta.page - 1) * result.meta.limit + 1;
  const resultTo = Math.min(result.meta.page * result.meta.limit, result.meta.totalItems);

  return (
    <div className="mx-auto max-w-site px-gutter py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">
          {searchParams.q ? `Search: "${searchParams.q}"` : "Search"}
        </span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {searchParams.q ? `Results for "${searchParams.q}"` : "Search"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
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

        <div className="flex flex-col gap-5">
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
          <ProductGrid result={result} basePath="/search" searchParams={currentSearchParams} />
        </div>
      </div>
    </div>
  );
}
