import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductPurchasePanel } from "../../../components/product-purchase-panel";
import { ProductGallery } from "../../../components/product-gallery";
import { ProductTabs } from "../../../components/product-tabs";
import { ProductCard } from "../../../components/product-card";
import { ProductReviews } from "../../../components/product-reviews";
import { ProductQueries } from "../../../components/product-queries";
import { RecentlyViewedTracker, RecentlyViewedSection } from "../../../components/recently-viewed";
import { WishlistButton } from "../../../components/wishlist-button";
import { getProductBySlug, getProducts } from "../../../lib/api/catalog";

interface PageProps {
  params: { productSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await getProductBySlug(params.productSlug);
    return {
      title: product.name,
      description: product.description?.slice(0, 160) ?? product.name,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.productSlug).catch(() => null);
  if (!product) notFound();

  // Related products — same category, excluding current
  const relatedResult = await getProducts({
    categoryId: product.category?.id,
    limit: 8,
  }).catch(() => ({ data: [], meta: { page: 1, limit: 8, totalItems: 0, totalPages: 1 } }));
  const related = relatedResult.data.filter((p) => p.id !== product.id).slice(0, 4);

  const hasVariants = product.variants.length > 0;
  const hasMultipleVariants = product.variants.length > 1;

  // Build attribute summary for "Additional Information" tab
  const attrRows: Array<{ label: string; value: string }> = [];
  if (product.sku) attrRows.push({ label: "SKU", value: product.sku });
  if (product.brand) attrRows.push({ label: "Brand", value: product.brand.name });
  if (product.category) attrRows.push({ label: "Category", value: product.category.name });
  if (hasMultipleVariants)
    attrRows.push({ label: "Variants", value: String(product.variants.length) });

  const descriptionContent = (
    <div>
      {product.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
          {product.description}
        </p>
      ) : (
        <p className="text-sm text-foreground-muted">No description available.</p>
      )}
    </div>
  );

  const additionalContent = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {attrRows.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <td className="py-2.5 pr-6 font-medium text-foreground w-40">{row.label}</td>
              <td className="py-2.5 text-foreground-muted">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="mx-auto max-w-site px-gutter py-8">
      {/* Track this page view for recently viewed */}
      <RecentlyViewedTracker productId={product.id} />
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/c/${product.category.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      {/* Main product section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
        {/* Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Info + purchase — sticky on desktop */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Brand & Name */}
          <div>
            <div className="mb-1 flex items-center gap-3">
              {product.brand && (
                <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
                  {product.brand.name}
                </span>
              )}
              {product.category && (
                <Link
                  href={`/c/${product.category.slug}`}
                  className="text-xs text-foreground-muted hover:text-primary transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                {product.name}
              </h1>
              <WishlistButton productId={product.id} productSlug={product.slug} className="shrink-0 mt-1" />
            </div>
            {!hasVariants && product.sku && (
              <p className="mt-1 text-xs text-foreground-muted">SKU: {product.sku}</p>
            )}
          </div>

          {/* Purchase panel */}
          <ProductPurchasePanel product={product} />

          {/* Delivery info */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                <div>
                  <p className="text-xs font-medium text-foreground">Free Delivery</p>
                  <p className="text-xs text-foreground-muted">On orders above ₹999</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                <div>
                  <p className="text-xs font-medium text-foreground">Easy Returns</p>
                  <p className="text-xs text-foreground-muted">7-day hassle-free returns</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                <div>
                  <p className="text-xs font-medium text-foreground">Secure Payment</p>
                  <p className="text-xs text-foreground-muted">100% secure transactions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                <div>
                  <p className="text-xs font-medium text-foreground">Quality Assured</p>
                  <p className="text-xs text-foreground-muted">Authentic products only</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description + Additional Info + Reviews + Queries */}
      <div className="mt-12 border-t border-border pt-8">
        <ProductTabs
          tabs={[
            { id: "description", label: "Description", content: descriptionContent },
            ...(attrRows.length > 0
              ? [{ id: "info", label: "Additional Information", content: additionalContent }]
              : []),
            {
              id: "reviews",
              label: "Reviews",
              content: <ProductReviews productId={product.id} productSlug={product.slug} />,
            },
            {
              id: "queries",
              label: "Q&A",
              content: <ProductQueries productId={product.id} productSlug={product.slug} />,
            },
          ]}
        />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-semibold text-foreground">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently viewed */}
      <RecentlyViewedSection excludeProductId={product.id} />
    </div>
  );
}
