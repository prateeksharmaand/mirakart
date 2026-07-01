import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "../components/product-card";
import { getBanners } from "../lib/api/banners";
import { getCategories, getProducts } from "../lib/api/catalog";
import type { Category } from "../types/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const [heroBanners, categories, featuredProducts] = await Promise.all([
    getBanners("HOME_HERO").catch(() => []),
    getCategories(true).catch(() => [] as Category[]) as Promise<Category[]>,
    getProducts({ isFeatured: true, limit: 8 }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 8, totalItems: 0, totalPages: 1 },
    })),
  ]);

  const hero = heroBanners[0];

  return (
    <div className="flex flex-col gap-16 pb-16">
      {hero ? (
        <Link href={hero.linkUrl ?? "#"} className="relative block aspect-[16/6] w-full overflow-hidden bg-background-light">
          <Image src={hero.media.url} alt={hero.title} fill priority sizes="100vw" className="object-cover" />
        </Link>
      ) : null}

      <section className="mx-auto w-full max-w-site px-gutter">
        <h2 className="mb-6 text-2xl font-medium text-foreground">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 12).map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-md border border-border p-4 text-center transition-colors hover:border-primary"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-background-light">
                {category.iconMedia ? (
                  <Image src={category.iconMedia.url} alt={category.name} fill className="object-cover" />
                ) : null}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.data.length > 0 ? (
        <section className="mx-auto w-full max-w-site px-gutter">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-foreground">Featured Products</h2>
            <Link href="/search" className="text-sm font-medium text-primary">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
