import type { Metadata } from "next";
import { PriceFilter } from "../../components/price-filter";
import { ProductGrid } from "../../components/product-grid";
import { getProducts } from "../../lib/api/catalog";

interface PageProps {
  searchParams: { q?: string; page?: string; minPrice?: string; maxPrice?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return { title: searchParams.q ? `Search: ${searchParams.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1);
  const result = await getProducts({
    search: searchParams.q,
    page,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } }));

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <h1 className="mb-8 text-3xl font-medium text-foreground">
        {searchParams.q ? `Results for "${searchParams.q}"` : "Search"}
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <PriceFilter />
        </aside>
        <ProductGrid
          result={result}
          basePath="/search"
          searchParams={{ q: searchParams.q, minPrice: searchParams.minPrice, maxPrice: searchParams.maxPrice }}
        />
      </div>
    </div>
  );
}
