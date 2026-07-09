import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { NewsletterForm } from "../components/newsletter-form";
import { getBanners } from "../lib/api/banners";
import { getProducts } from "../lib/api/catalog";

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

  const hero = heroBanners[0];

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden bg-background-light">
        {hero ? (
          <Link href={hero.linkUrl ?? "#"} className="relative block aspect-[21/9] w-full">
            <Image
              src={hero.media.url}
              alt={hero.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-site px-gutter">
                <div className="max-w-md">
                  <p className="mb-3 text-sm font-medium uppercase tracking-widest text-foreground-muted">
                    New Collection
                  </p>
                  <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-5xl">
                    {hero.title}
                  </h1>
                  <div className="mt-6 flex gap-3">
                    <span className="btn-primary">
                      Shop Now <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          /* Fallback hero when no banner is configured */
          <div className="relative flex aspect-[21/9] w-full items-center bg-gradient-to-r from-background-light to-background">
            <div className="mx-auto w-full max-w-site px-gutter">
              <div className="max-w-lg">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">New Collection</p>
                <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-5xl">
                  Discover Your Style
                </h1>
                <p className="mt-4 text-base text-foreground-muted">
                  Shop from thousands of verified sellers and find the perfect look.
                </p>
                <div className="mt-8 flex gap-3">
                  <Link href="/search" className="btn-primary">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/search" className="btn-outline">
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Promo Banners Strip */}
      <section className="mx-auto w-full max-w-site px-gutter py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Women's Fashion", desc: "Up to 40% off", color: "bg-[#f5f0eb]", href: "/c/women" },
            { label: "Men's Clothing", desc: "New arrivals daily", color: "bg-[#edf0f5]", href: "/c/men" },
            { label: "Kids & Baby", desc: "Starting from ₹299", color: "bg-[#f0f5ed]", href: "/c/kids" },
          ].map((promo) => (
            <Link
              key={promo.label}
              href={promo.href}
              className={`group flex items-center justify-between overflow-hidden rounded-sm px-6 py-8 transition-shadow hover:shadow-card ${promo.color}`}
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-foreground-muted">{promo.desc}</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">{promo.label}</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Shop Now <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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

      {/* Banner CTA */}
      <section className="mx-auto w-full max-w-site px-gutter py-14">
        <div className="overflow-hidden rounded-sm bg-foreground px-8 py-12 text-center text-background sm:px-16">
          <p className="text-xs uppercase tracking-widest text-background/60">Limited Time Offer</p>
          <h2 className="mt-2 text-3xl font-bold">Get 20% Off Your First Order</h2>
          <p className="mt-3 text-sm text-background/70">
            Sign up for our newsletter and receive an exclusive discount code.
          </p>
          <NewsletterForm className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" />
        </div>
      </section>

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
