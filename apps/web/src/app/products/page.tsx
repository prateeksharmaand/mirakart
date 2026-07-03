import type { Metadata } from "next";
import Link from "next/link";
import { PriceFilter } from "../../components/price-filter";
import { ProductGrid } from "../../components/product-grid";
import { getProducts } from "../../lib/api/catalog";

interface PageProps {
  searchParams: { tag?: string; page?: string; minPrice?: string; maxPrice?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: searchParams.tag ? `Tag: ${searchParams.tag}` : "Products",
    description: searchParams.tag ? `Browse products tagged "${searchParams.tag}"` : "Browse all products",
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1);
  const result = await getProducts({
    tagSlug: searchParams.tag,
    page,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  }).catch(() => ({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } }));

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <nav className="mb-6 text-sm text-foreground-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Products</span>
        {searchParams.tag ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-foreground capitalize">{searchParams.tag.replace(/-/g, " ")}</span>
          </>
        ) : null}
      </nav>

      <h1 className="mb-8 text-3xl font-medium text-foreground">
        {searchParams.tag
          ? <span className="capitalize">{searchParams.tag.replace(/-/g, " ")}</span>
          : "All Products"}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <PriceFilter />
        </aside>
        <ProductGrid
          result={result}
          basePath="/products"
          searchParams={{ tag: searchParams.tag, minPrice: searchParams.minPrice, maxPrice: searchParams.maxPrice }}
        />
      </div>
    </div>
  );
}
