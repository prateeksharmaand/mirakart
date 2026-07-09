"use client";

import * as React from "react";
import { formatPrice } from "../lib/format";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onChangeComplete?: (value: [number, number]) => void;
}

type Thumb = "min" | "max";

export function PriceRangeSlider({ min, max, value, onChange, onChangeComplete }: PriceRangeSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef<Thumb | null>(null);
  const [local, setLocal] = React.useState<[number, number]>(value);

  React.useEffect(() => {
    if (!draggingRef.current) setLocal(value);
  }, [value]);

  const span = Math.max(max - min, 1);
  const step = Math.max(1, Math.round(span / 100));
  const pct = (v: number) => ((v - min) / span) * 100;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  function valueFromClientX(clientX: number): number {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : clamp01((clientX - rect.left) / rect.width);
    const raw = min + ratio * span;
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped);
  }

  function updateThumb(thumb: Thumb, next: number) {
    setLocal((prev) => {
      const [lo, hi] = prev;
      const updated: [number, number] =
        thumb === "min" ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
      onChange(updated);
      return updated;
    });
  }

  function handlePointerDown(thumb: Thumb) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = thumb;
      const move = (ev: PointerEvent) => updateThumb(thumb, valueFromClientX(ev.clientX));
      const up = () => {
        draggingRef.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setLocal((current) => {
          onChangeComplete?.(current);
          return current;
        });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
  }

  function handleTrackClick(e: React.MouseEvent) {
    if (e.target !== trackRef.current) return;
    const clicked = valueFromClientX(e.clientX);
    const [lo, hi] = local;
    const thumb: Thumb = Math.abs(clicked - lo) <= Math.abs(clicked - hi) ? "min" : "max";
    updateThumb(thumb, clicked);
    onChangeComplete?.(thumb === "min" ? [Math.min(clicked, hi), hi] : [lo, Math.max(clicked, lo)]);
  }

  function handleKeyDown(thumb: Thumb) {
    return (e: React.KeyboardEvent) => {
      const current = thumb === "min" ? local[0] : local[1];
      let next = current;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(current - step);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(current + step);
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      else return;
      e.preventDefault();
      updateThumb(thumb, next);
      onChangeComplete?.(thumb === "min" ? [next, local[1]] : [local[0], next]);
    };
  }

  const [lo, hi] = local;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">
        {formatPrice(lo)} – {formatPrice(hi)}
        {hi >= max ? "+" : ""}
      </p>
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-border"
      >
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${pct(lo)}%`, width: `${Math.max(pct(hi) - pct(lo), 0)}%` }}
        />
        {(["min", "max"] as const).map((thumb) => {
          const thumbValue = thumb === "min" ? lo : hi;
          return (
            <button
              key={thumb}
              type="button"
              role="slider"
              aria-label={thumb === "min" ? "Minimum price" : "Maximum price"}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={thumbValue}
              tabIndex={0}
              onPointerDown={handlePointerDown(thumb)}
              onKeyDown={handleKeyDown(thumb)}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-soft transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40"
              style={{ left: `${pct(thumbValue)}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
