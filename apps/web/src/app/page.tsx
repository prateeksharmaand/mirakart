import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { getBanners } from "../lib/api/banners";
import { getCategories, getProducts } from "../lib/api/catalog";
import type { Category } from "../types/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const [heroBanners, categories, featuredProducts, newArrivals] = await Promise.all([
    getBanners("HOME_HERO").catch(() => []),
    getCategories(true).catch(() => [] as Category[]) as Promise<Category[]>,
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
                  {hero.subtitle && (
                    <p className="mb-3 text-sm font-medium uppercase tracking-widest text-foreground-muted">
                      {hero.subtitle}
                    </p>
                  )}
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

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-site px-gutter pb-14">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="section-title text-left after:left-0 after:translate-x-0">Shop by Category</h2>
            <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All categories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal scrollable category cards — Clotya style */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.slice(0, 10).map((category, i) => {
              // Alternating muted background colours when no image — matches Clotya's demo palette
              const bgColors = [
                "bg-[#f5f0eb]", "bg-[#edf0f5]", "bg-[#f0f5ed]",
                "bg-[#f5edf5]", "bg-[#f5f5ed]", "bg-[#edf5f5]",
                "bg-[#f5edee]", "bg-[#ededf5]", "bg-[#f0edf5]", "bg-[#edf5ef]",
              ];
              return (
                <Link
                  key={category.id}
                  href={`/c/${category.slug}`}
                  className="group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-sm sm:w-44"
                >
                  <div className={`relative aspect-[3/4] w-full overflow-hidden ${bgColors[i % bgColors.length]}`}>
                    {category.iconMedia ? (
                      <Image
                        src={category.iconMedia.url}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 ease-theme group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
                        <span className="text-4xl">
                          {["👗","👔","👟","👜","💍","🧴","🏠","🎮","📚","🌿"][i % 10]}
                        </span>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />
                  </div>
                  <div className="border border-t-0 border-border bg-background p-3 text-center">
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {category.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
          <form className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email address"
              className="h-form w-full max-w-xs rounded border-0 bg-white/10 px-4 text-sm text-background placeholder:text-background/50 outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="btn-primary bg-primary text-white hover:bg-primary/90">
              Claim Discount
            </button>
          </form>
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
