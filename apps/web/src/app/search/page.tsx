import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterSidebar } from "../../components/filter-sidebar";
import { SortSelect } from "../../components/sort-select";
import { parseSortParam } from "../../lib/sort";
import { ProductGrid } from "../../components/product-grid";
import { getProducts, getAttributes, getBrands, getTags, getPriceRange } from "../../lib/api/catalog";

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
  };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return { title: searchParams.q ? `Search: ${searchParams.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1);
  const { sortBy, sortOrder } = parseSortParam(searchParams.sort);
  const attributeValueIds = searchParams.av ? searchParams.av.split(",").filter(Boolean) : undefined;

  const [result, attributes, brands, tags, priceBounds] = await Promise.all([
    getProducts({
      search: searchParams.q,
      page,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      attributeValueIds,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      categoryId: searchParams.categoryId || undefined,
      sortBy,
      sortOrder,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    getTags().catch(() => []),
    getPriceRange({
      search: searchParams.q,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      categoryId: searchParams.categoryId || undefined,
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
  };

  return (
    <div className="mx-auto max-w-site px-gutter py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">
          {searchParams.q ? `Search: "${searchParams.q}"` : "Search"}
        </span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {searchParams.q ? `Results for "${searchParams.q}"` : "Search"}
        </h1>
        <p className="text-sm text-foreground-muted">
          {result.meta.totalItems} {result.meta.totalItems === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <Suspense fallback={null}>
            <FilterSidebar
              categories={[]}
              brands={brands}
              tags={tags}
              attributes={attributes}
              priceBounds={priceBounds}
              hideCategoryFilter
            />
          </Suspense>
        </aside>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-end">
            <Suspense fallback={null}>
              <SortSelect currentSort={searchParams.sort} />
            </Suspense>
          </div>
          <ProductGrid result={result} basePath="/search" searchParams={currentSearchParams} />
        </div>
      </div>
    </div>
  );
}
