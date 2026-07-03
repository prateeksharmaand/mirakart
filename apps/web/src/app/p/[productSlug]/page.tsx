import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "../../../components/product-purchase-panel";
import { ProductGallery } from "../../../components/product-gallery";
import { getProductBySlug } from "../../../lib/api/catalog";

interface PageProps {
  params: { productSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await getProductBySlug(params.productSlug);
    return { title: product.name, description: product.description.slice(0, 160) };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.productSlug).catch(() => null);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <nav className="mb-6 text-sm text-foreground-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/c/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand ? <span className="text-sm text-foreground-muted">{product.brand.name}</span> : null}
            <h1 className="text-3xl font-medium text-foreground">{product.name}</h1>
          </div>

          <ProductPurchasePanel product={product} />

          <div className="border-t border-border pt-6">
            <h2 className="mb-2 text-sm font-medium text-foreground">Description</h2>
            <p className="whitespace-pre-line text-sm text-foreground-muted">{product.description}</p>
          </div>

          {product.tags && product.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/products?tag=${tag.slug}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-primary hover:text-primary transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
