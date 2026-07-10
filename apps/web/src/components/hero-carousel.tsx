"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

  if (banners.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-site px-gutter py-8">
      <div className="relative overflow-hidden">
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.linkUrl ?? "#"}
            aria-hidden={i !== active}
            tabIndex={i === active ? 0 : -1}
            className={`flex h-[420px] w-full flex-col-reverse transition-opacity duration-700 sm:h-[460px] sm:flex-row lg:h-[540px] ${
              i === active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            {/* Text panel */}
            <div className="flex w-full shrink-0 flex-col justify-center bg-background-light px-6 py-8 sm:w-[38%] sm:px-10 lg:px-14">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-foreground-muted">
                New Collection
              </p>
              <h1 className="text-3xl font-bold leading-tight text-foreground lg:text-4xl xl:text-5xl">
                {banner.title}
              </h1>
              <div className="mt-6 flex gap-3">
                <span className="btn-primary w-fit">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Image panel */}
            <div className="relative w-full flex-1 overflow-hidden sm:w-auto">
              <Image
                src={banner.media.url}
                alt={banner.title}
                fill
                priority={i === 0}
                sizes="(min-width: 640px) 62vw, 1290px"
                className="object-cover"
              />
            </div>
          </Link>
        ))}

        {banners.length > 1 && (
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
        )}
      </div>
    </div>
  );
}
