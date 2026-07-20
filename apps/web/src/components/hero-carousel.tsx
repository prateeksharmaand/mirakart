"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "../lib/api/banners";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  function goPrev() {
    setActive((i) => (i - 1 + banners.length) % banners.length);
  }
  function goNext() {
    setActive((i) => (i + 1) % banners.length);
  }

  if (banners.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-site px-gutter py-8">
      <div className="relative h-[420px] w-full overflow-hidden rounded-sm sm:h-[460px] lg:h-[540px]">
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.linkUrl ?? "#"}
            aria-hidden={i !== active}
            tabIndex={i === active ? 0 : -1}
            className={`absolute inset-0 flex items-center transition-opacity duration-700 ${
              i === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={banner.media.url}
              alt={banner.title}
              fill
              priority={i === 0}
              sizes="1290px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
            <div className="relative z-[1] max-w-md px-6 sm:px-10 lg:px-16">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-white/80">New Collection</p>
              <h1 className="text-3xl font-bold leading-tight text-white lg:text-4xl xl:text-5xl">
                {banner.title}
              </h1>
              <span className="btn-primary mt-6 inline-flex w-fit items-center gap-2">
                Shop Collection <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft transition-colors hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-5 right-6 z-10 flex gap-2 sm:right-10">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-2 bg-background/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
