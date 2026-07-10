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
    <div className="relative w-full overflow-hidden bg-background-light">
      {banners.map((banner, i) => (
        <Link
          key={banner.id}
          href={banner.linkUrl ?? "#"}
          aria-hidden={i !== active}
          tabIndex={i === active ? 0 : -1}
          className={`block aspect-[21/9] w-full transition-opacity duration-700 ${
            i === active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
          }`}
        >
          <Image
            src={banner.media.url}
            alt={banner.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-site px-gutter">
              <div className="max-w-md">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-foreground-muted">
                  New Collection
                </p>
                <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-5xl">{banner.title}</h1>
                <div className="mt-6 flex gap-3">
                  <span className="btn-primary">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
  );
}
