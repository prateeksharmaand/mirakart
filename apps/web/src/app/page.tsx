import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { HeroCarousel } from "../components/hero-carousel";
import { FeatureStrip } from "../components/feature-strip";
import { getBanners } from "../lib/api/banners";
import type { Banner } from "../lib/api/banners";
import { getCategories, getProducts } from "../lib/api/catalog";
import type { Category } from "../types/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const [heroBanners, featuredProducts, newArrivals] = await Promise.all([
    getBanners("HOME_HERO").catch(() => []),
    getProducts({ isFeatured: true, limit: 8 }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 8, totalItems: 0, totalPages: 1 },
    })),
    getProducts({ limit: 4 }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 4, totalItems: 0, totalPages: 1 },
    })),
  ]);

  // When no HOME_HERO banners are configured, feature a real category
  // (with an actual banner/icon image) instead of showing hardcoded copy.
  let heroFallbackBanner: Banner | null = null;
  if (heroBanners.length === 0) {
    const categories = (await getCategories(true).catch(() => [])) as Category[];
    const featured = categories.find((c) => c.bannerMedia) ?? categories.find((c) => c.iconMedia) ?? null;
    const media = featured?.bannerMedia ?? featured?.iconMedia ?? null;
    if (featured && media) {
      heroFallbackBanner = {
        id: featured.id,
        title: featured.name,
        linkUrl: `/c/${featured.slug}`,
        position: "HOME_HERO",
        media,
      };
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      {heroBanners.length > 0 ? (
        <HeroCarousel banners={heroBanners} />
      ) : heroFallbackBanner ? (
        <HeroCarousel banners={[heroFallbackBanner]} />
      ) : (
        /* Last-resort fallback: no banners and no category images to feature */
        <section className="relative flex aspect-[21/9] w-full items-center justify-center bg-gradient-to-r from-background-light to-background">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">Welcome to Mirakart</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-foreground-muted">
              New arrivals are on their way — check back soon.
            </p>
            <Link href="/products" className="btn-primary mt-6 inline-flex">
              Browse Products
            </Link>
          </div>
        </section>
      )}

      <FeatureStrip />

      {/* Featured Products */}
      {featuredProducts.data.length > 0 && (
        <section className="bg-background-light py-14">
          <div className="mx-auto w-full max-w-site px-gutter">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="section-title text-left after:left-0 after:translate-x-0">
                Featured Products
              </h2>
              <Link href="/search?featured=true" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Don't Miss The Last Deals */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto flex max-w-site items-center gap-8 px-gutter py-8 sm:gap-16">
          <h2 className="min-w-fit text-xl font-semibold text-foreground sm:text-2xl">
            Don't Miss The<br />Last Deals
          </h2>
          <div className="h-12 w-px shrink-0 bg-border" />
          <p className="text-sm leading-relaxed text-primary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas
            accumsan lacus vel facilisis.
          </p>
        </div>
      </section>

      {/* Latest Buyers Reviews */}
      <section className="mx-auto w-full max-w-site px-gutter py-16">
        <div className="mb-3 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Latest Buyers Reviews</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
            aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-0 divide-x divide-border border border-border sm:grid-cols-3">
          {[
            { name: "Teresa Holland", review: "Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan facilisis." },
            { name: "Scarlett Edwards", review: "Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan facilisis." },
            { name: "Teresa Holland", review: "Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan facilisis." },
          ].map((review, i) => (
            <div key={i} className="flex flex-col items-center gap-4 px-8 py-10 text-center">
              {/* Stars */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-primary">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground">{review.review}</p>
              <p className="text-sm text-foreground-muted">{review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.data.length > 0 && (
        <section className="pb-16">
          <div className="mx-auto w-full max-w-site px-gutter">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="section-title text-left after:left-0 after:translate-x-0">
                New Arrivals
              </h2>
              <Link href="/search?sort=newest" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                See More <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
