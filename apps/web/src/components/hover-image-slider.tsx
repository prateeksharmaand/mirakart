"use client";

import * as React from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

interface HoverImageSliderProps {
  images: { url: string }[];
  alt: string;
  isOutOfStock?: boolean;
}

// Splits the image into N equal horizontal panes — moving the cursor across
// them cycles the displayed image, with dot indicators showing which is active.
export function HoverImageSlider({ images, alt, isOutOfStock }: HoverImageSliderProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.min(images.length - 1, Math.max(0, Math.floor((x / rect.width) * images.length)));
    setActiveIndex(index);
  }

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background-light">
        <ShoppingBag className="h-8 w-8 text-border" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(0)}>
      {images.map((image, index) => (
        <Image
          key={image.url}
          src={image.url}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition-opacity duration-200 ease-theme ${isOutOfStock ? "opacity-50 grayscale" : ""} ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1 opacity-0 transition-opacity duration-300 ease-theme group-hover:opacity-100">
          {images.map((image, index) => (
            <span
              key={image.url}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === activeIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
