"use client";

import * as React from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  media: { url: string };
}

interface Props {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const sorted = React.useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.sortOrder - b.sortOrder;
      }),
    [images],
  );

  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const selected = sorted[selectedIdx] ?? sorted[0];

  if (sorted.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background-light flex items-center justify-center">
        <span className="text-foreground-muted text-sm">No image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background-light">
        {selected && (
          <Image
            key={selected.id}
            src={selected.media.url}
            alt={productName}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {sorted.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIdx(index)}
              className={`relative aspect-square overflow-hidden rounded-sm bg-background-light transition-all focus:outline-none ${
                selectedIdx === index
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.media.url}
                alt={`${productName} — image ${index + 1}`}
                fill
                sizes="10vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
