import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterSidebar } from "../../../components/filter-sidebar";
import { SortSelect, parseSortParam } from "../../../components/sort-select";
import { ProductGrid } from "../../../components/product-grid";
import {
  getCategoryBySlug,
  getProducts,
  getAttributes,
  getBrands,
  getTags,
} from "../../../lib/api/catalog";

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

  const [result, attributes, brands, tags] = await Promise.all([
    getProducts({
      categoryId: category.id,
      page,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      attributeValueIds,
      brandId: searchParams.brandId || undefined,
      tagSlug: searchParams.tag || undefined,
      sortBy,
      sortOrder,
    }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } })),
    getAttributes().catch(() => []),
    getBrands(200).catch(() => []),
    getTags().catch(() => []),
  ]);

  const currentSearchParams = {
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    av: searchParams.av,
    brandId: searchParams.brandId,
    tag: searchParams.tag,
    sort: searchParams.sort,
  };

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

      {/* Title + count */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-foreground-muted">{category.description}</p>
          )}
        </div>
        <p className="text-sm text-foreground-muted">
          {result.meta.totalItems}{" "}
          {result.meta.totalItems === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <Suspense fallback={null}>
            {/* hideCategoryFilter — category is already locked by URL slug */}
            <FilterSidebar
              categories={[]}
              brands={brands}
              tags={tags}
              attributes={attributes}
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
