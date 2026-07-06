"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

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
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState({ active: false, x: 50, y: 50 });

  const selected = sorted[selectedIdx] ?? sorted[0];

  function prev() {
    setSelectedIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  }
  function next() {
    setSelectedIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));
  }

  React.useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, sorted.length]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ active: true, x, y });
  }

  if (sorted.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background-light flex items-center justify-center">
        <span className="text-foreground-muted text-sm">No image</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="relative">
          <div
            className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-md bg-background-light"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoom({ active: false, x: 50, y: 50 })}
            onClick={() => setLightboxOpen(true)}
          >
            {selected && (
              <Image
                key={selected.id}
                src={selected.media.url}
                alt={productName}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-100"
                style={{
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  transform: zoom.active ? "scale(1.5)" : "scale(1)",
                  transition: zoom.active ? "none" : "transform 0.2s ease",
                }}
              />
            )}
            {/* Zoom hint */}
            {!zoom.active && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-[10px] text-white opacity-0 hover:opacity-100 pointer-events-none group-hover:opacity-100">
                <ZoomIn className="h-3 w-3" /> Hover to zoom
              </span>
            )}
          </div>

          {/* Prev/Next arrows (only if multiple images) */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow hover:bg-background transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedIdx(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded bg-background-light transition-all focus:outline-none ${
                  selectedIdx === index
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-50 hover:opacity-90"
                }`}
              >
                <Image
                  src={image.media.url}
                  alt={`${productName} — ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-h-[90dvh] max-w-[90dvw] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {selected && (
              <Image
                src={selected.media.url}
                alt={productName}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Arrows */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {selectedIdx + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  );
}
