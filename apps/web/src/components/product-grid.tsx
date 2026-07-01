import Link from "next/link";
import { EmptyState } from "@mirakart/ui";
import { ProductCard } from "./product-card";
import type { PaginatedResult, ProductListItem } from "../types/catalog";

export function ProductGrid({
  result,
  basePath,
  searchParams = {},
}: {
  result: PaginatedResult<ProductListItem>;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (result.data.length === 0) {
    return <EmptyState title="No products found" description="Try adjusting your filters or search terms." />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {result.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <LinkPagination meta={result.meta} basePath={basePath} searchParams={searchParams} />
    </div>
  );
}

function LinkPagination({
  meta,
  basePath,
  searchParams,
}: {
  meta: PaginatedResult<unknown>["meta"];
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (meta.totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={hrefFor(page)}
          aria-current={page === meta.page ? "page" : undefined}
          className={
            page === meta.page
              ? "flex h-9 w-9 items-center justify-center rounded-sm border border-primary bg-primary text-sm text-primary-foreground"
              : "flex h-9 w-9 items-center justify-center rounded-sm border border-border text-sm text-foreground hover:bg-background-light"
          }
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
