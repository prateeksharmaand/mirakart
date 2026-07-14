import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterSidebar } from "../../../components/filter-sidebar";
import { SortSelect } from "../../../components/sort-select";
import { PageSizeSelect } from "../../../components/page-size-select";
import { DEFAULT_PAGE_SIZE } from "../../../lib/pagination";
import { parseSortParam } from "../../../lib/sort";
import { ProductGrid } from "../../../components/product-grid";
import { collectDescendantIds, expandWithDescendants, findCategoryNode } from "../../../lib/category-tree-utils";
import {
  getCategoryBySlug,
  getCategories,
  getProducts,
  getAttributes,
  getBrands,
  getTags,
  getPriceRange,
} from "../../../lib/api/catalog";
import type { CategoryNode } from "../../../types/catalog";

interface PageProps {
  params: { categorySlug: string };
  searchParams: {
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    av?: string;
    brandId?: string;
    tag?: string;
    sort?: string;
    categoryIds?: string;
    limit?: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const category = await getCategoryBySlug(params.categorySlug);
    return { title: category.name, description: category.description ?? undefined };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await getCategoryBySlug(params.categorySlug).catch(() => null);
  if (!category) notFound();

  const page = Number(searchParams.page ?? 1);
  const attributeValueIds = searchParams.av
    ? searchParams.av.split(",").filter(Boolean)
    : undefined;
  const { sortBy, sortOrder } = parseSortParam(searchParams.sort);
  const limit = searchParams.limit ? Number(searchParams.limit) : DEFAULT_PAGE_SIZE;

  const [attributes, brands, tags, fullTree] = await Promise.all([
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    getTags().catch(() => []),
    (getCategories(false) as Promise<CategoryNode[]>).catch(() => [] as CategoryNode[]),
  ]);

  // Default scope is this category + all of its subcategories (so a category
  // with no products tagged directly to it -- all tagged to its subcategories
  // -- isn't empty). If the user checks specific subcategories in the sidebar
  // tree, narrow down to just those instead of the full subtree. Checking a
  // category outside this branch (e.g. a different top-level category) adds
  // it alongside, expanded the same way.
  const ownNode = findCategoryNode(fullTree, category.id);
  const descendantIds = new Set(ownNode ? collectDescendantIds(ownNode) : []);

  const explicitIds = searchParams.categoryIds ? searchParams.categoryIds.split(",").filter(Boolean) : [];
  const explicitWithinOwn = explicitIds.filter((id) => descendantIds.has(id));
  const explicitOutsideOwn = explicitIds.filter((id) => id !== category.id && !descendantIds.has(id));

  const ownScopeIds =
    explicitWithinOwn.length > 0
      ? expandWithDescendants(fullTree, explicitWithinOwn)
      : expandWithDescendants(fullTree, [category.id]);
  const categoryIds = [...new Set([...ownScopeIds, ...expandWithDescendants(fullTree, explicitOutsideOwn)])];

  const [result, priceBounds] = await Promise.all([
    getProducts({
      categoryId: category.id,
      categoryIds,
      page,
      limit,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      attributeValueIds,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      sortBy,
      sortOrder,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getPriceRange({ categoryId: category.id, categoryIds }).catch(() => ({ min: 0, max: 0 })),
  ]);

  const currentSearchParams = {
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    av: searchParams.av,
    brandId: searchParams.brandId,
    tag: searchParams.tag,
    sort: searchParams.sort,
    categoryIds: searchParams.categoryIds,
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
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Banner */}
      {category.bannerMedia ? (
        <div className="relative mb-6 flex h-56 items-center overflow-hidden rounded-sm bg-background-light sm:h-72">
          <Image src={category.bannerMedia.url} alt={category.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
          <div className="relative z-10 max-w-md px-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{category.name}</h1>
            {category.description && (
              <p className="mt-2 text-sm text-foreground-muted">{category.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-foreground-muted">{category.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <Suspense fallback={null}>
            <FilterSidebar
              categoryTree={fullTree}
              pinnedCategoryId={category.id}
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

          <ProductGrid
            result={result}
            basePath={`/c/${params.categorySlug}`}
            searchParams={currentSearchParams}
          />
        </div>
      </div>
    </div>
  );
}
