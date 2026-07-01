import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceFilter } from "../../../components/price-filter";
import { ProductGrid } from "../../../components/product-grid";
import { getCategoryBySlug, getProducts } from "../../../lib/api/catalog";

interface PageProps {
  params: { categorySlug: string };
  searchParams: { page?: string; minPrice?: string; maxPrice?: string };
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
  const result = await getProducts({
    categoryId: category.id,
    page,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } }));

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <h1 className="mb-2 text-3xl font-medium text-foreground">{category.name}</h1>
      {category.description ? <p className="mb-8 text-foreground-muted">{category.description}</p> : null}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <PriceFilter />
        </aside>
        <ProductGrid
          result={result}
          basePath={`/c/${params.categorySlug}`}
          searchParams={{ minPrice: searchParams.minPrice, maxPrice: searchParams.maxPrice }}
        />
      </div>
    </div>
  );
}
