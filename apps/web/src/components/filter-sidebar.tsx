"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X, SlidersHorizontal, Check } from "lucide-react";
import type { Category, Brand } from "../types/catalog";
import type { AttributeFilter, PriceRange, Tag } from "../lib/api/catalog";
import { PriceRangeSlider } from "./price-range-slider";

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  tags: Tag[];
  attributes: AttributeFilter[];
  priceBounds: PriceRange;
  hideCategoryFilter?: boolean;
}

// Returns true if the hex color is light (use dark icon on top of it)
function isLightHex(hex: string): boolean {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186;
  } catch {
    return false;
  }
}

function Section({
  title,
  children,
  defaultOpen = true,
  badge,
  onClear,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  onClear?: () => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground"
        >
          {title}
          {badge ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {badge}
            </span>
          ) : null}
          <ChevronDown
            className={`ml-auto h-4 w-4 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {onClear && badge ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-3 text-[11px] text-primary hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Collapsible list — shows first `limit` items, toggle "Show more/less"
function CollapsibleList({
  children,
  limit = 6,
  total,
}: {
  children: React.ReactNode[];
  limit?: number;
  total: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? children : children.slice(0, limit);
  return (
    <>
      {shown}
      {total > limit && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : `Show ${total - limit} more`}
        </button>
      )}
    </>
  );
}

export function FilterSidebar({
  categories,
  brands,
  tags,
  attributes,
  priceBounds,
  hideCategoryFilter = false,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [brandSearch, setBrandSearch] = React.useState("");

  // URL state
  const currentCategoryId = searchParams.get("categoryId") ?? "";
  const currentBrandId = searchParams.get("brandId") ?? "";
  const currentTag = searchParams.get("tag") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const priceValue: [number, number] = [
    currentMinPrice ? Number(currentMinPrice) : priceBounds.min,
    currentMaxPrice ? Number(currentMaxPrice) : priceBounds.max,
  ];

  function handlePriceChangeComplete([lo, hi]: [number, number]) {
    push({
      minPrice: lo > priceBounds.min ? String(lo) : null,
      maxPrice: hi < priceBounds.max ? String(hi) : null,
    });
  }

  const selectedAvIds = React.useMemo(() => {
    const raw = searchParams.get("av");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  // Build a lookup: valueId → attribute name + value label for chips
  const avLookup = React.useMemo(() => {
    const map: Record<string, { attrName: string; label: string; colorHex?: string | null }> = {};
    for (const attr of attributes) {
      for (const v of attr.values) {
        map[v.id] = { attrName: attr.name, label: v.value, colorHex: v.colorHex };
      }
    }
    return map;
  }, [attributes]);

  function buildParams(updates: Record<string, string | null>): URLSearchParams {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    return params;
  }
  function push(updates: Record<string, string | null>) {
    router.push(`?${buildParams(updates).toString()}`);
  }

  function toggleAv(valueId: string) {
    const next = selectedAvIds.includes(valueId)
      ? selectedAvIds.filter((id) => id !== valueId)
      : [...selectedAvIds, valueId];
    push({ av: next.length > 0 ? next.join(",") : null });
  }

  function removeAv(valueId: string) {
    const next = selectedAvIds.filter((id) => id !== valueId);
    push({ av: next.length > 0 ? next.join(",") : null });
  }

  function clearAttrGroup(attrValues: AttributeFilter["values"]) {
    const idsToRemove = new Set(attrValues.map((v) => v.id));
    const next = selectedAvIds.filter((id) => !idsToRemove.has(id));
    push({ av: next.length > 0 ? next.join(",") : null });
  }

  function clearAll() {
    router.push("?");
  }

  const colorAttrs = attributes.filter((a) => a.type === "COLOR" && a.values.length > 0);
  const selectAttrs = attributes.filter((a) => a.type === "SELECT" && a.values.length > 0);
  const textAttrs = attributes.filter((a) => a.type === "TEXT" && a.values.length > 0);

  // Active chips data
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (currentCategoryId) {
    const cat = categories.find((c) => c.id === currentCategoryId);
    if (cat) activeChips.push({ key: "cat", label: cat.name, onRemove: () => push({ categoryId: null }) });
  }
  if (currentBrandId) {
    const brand = brands.find((b) => b.id === currentBrandId);
    if (brand) activeChips.push({ key: "brand", label: brand.name, onRemove: () => push({ brandId: null }) });
  }
  if (currentMinPrice || currentMaxPrice) {
    const label = currentMinPrice && currentMaxPrice
      ? `₹${currentMinPrice}–₹${currentMaxPrice}`
      : currentMinPrice ? `≥ ₹${currentMinPrice}` : `≤ ₹${currentMaxPrice}`;
    activeChips.push({
      key: "price",
      label,
      onRemove: () => push({ minPrice: null, maxPrice: null }),
    });
  }
  if (currentTag) {
    const tag = tags.find((t) => t.slug === currentTag);
    if (tag) activeChips.push({ key: "tag", label: tag.name, onRemove: () => push({ tag: null }) });
  }
  for (const avId of selectedAvIds) {
    const info = avLookup[avId];
    if (info) {
      activeChips.push({
        key: avId,
        label: `${info.attrName}: ${info.label}`,
        onRemove: () => removeAv(avId),
      });
    }
  }

  const SidebarContent = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Filters
        </span>
        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Price */}
      {priceBounds.max > priceBounds.min && (
        <Section
          title="Price"
          badge={currentMinPrice || currentMaxPrice ? 1 : 0}
          onClear={() => push({ minPrice: null, maxPrice: null })}
        >
          <PriceRangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceValue}
            onChange={() => {}}
            onChangeComplete={handlePriceChangeComplete}
          />
        </Section>
      )}

      {/* Categories */}
      {!hideCategoryFilter && categories.length > 0 && (
        <Section
          title="Categories"
          badge={currentCategoryId ? 1 : 0}
          onClear={() => push({ categoryId: null })}
        >
          <div className="flex flex-col gap-0.5">
            <CollapsibleList total={categories.length}>
              {categories.map((cat) => {
                const active = currentCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => push({ categoryId: active ? null : cat.id })}
                    className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "font-medium text-foreground"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        active
                          ? "border-foreground bg-foreground"
                          : "border-border"
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5 text-background" />}
                    </span>
                    {cat.name}
                  </button>
                );
              })}
            </CollapsibleList>
          </div>
        </Section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <Section
          title="Brands"
          badge={currentBrandId ? 1 : 0}
          onClear={() => push({ brandId: null })}
        >
          {brands.length > 5 && (
            <input
              type="text"
              placeholder="Search brands…"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="mb-2.5 w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
            />
          )}
          <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
            {brands
              .filter(
                (b) =>
                  !brandSearch ||
                  b.name.toLowerCase().includes(brandSearch.toLowerCase()),
              )
              .map((brand) => {
                const active = currentBrandId === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => push({ brandId: active ? null : brand.id })}
                    className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "font-medium text-foreground"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        active ? "border-foreground bg-foreground" : "border-border"
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5 text-background" />}
                    </span>
                    {brand.name}
                  </button>
                );
              })}
          </div>
        </Section>
      )}

      {/* COLOR attributes */}
      {colorAttrs.map((attr) => {
        const activeIds = attr.values.filter((v) => selectedAvIds.includes(v.id));
        return (
          <Section
            key={attr.id}
            title={attr.name}
            badge={activeIds.length || 0}
            onClear={() => clearAttrGroup(attr.values)}
          >
            <div className="flex flex-wrap gap-3">
              {attr.values.map((val) => {
                const isSelected = selectedAvIds.includes(val.id);
                const hex = val.colorHex ?? "#cccccc";
                const light = isLightHex(hex);
                return (
                  <div key={val.id} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      title={val.value}
                      onClick={() => toggleAv(val.id)}
                      style={{ backgroundColor: hex }}
                      className={`relative h-9 w-9 rounded-full border transition-all ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 border-transparent scale-105"
                          : "border-border/60 hover:ring-1 hover:ring-foreground-muted hover:ring-offset-1 hover:scale-105"
                      }`}
                    >
                      {isSelected && (
                        <span
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: light ? "#111" : "#fff" }}
                        >
                          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 drop-shadow-sm">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      <span className="sr-only">{val.value}</span>
                    </button>
                    <span
                      className={`max-w-[3rem] truncate text-center text-[10px] leading-tight ${
                        isSelected ? "font-semibold text-foreground" : "text-foreground-muted"
                      }`}
                    >
                      {val.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        );
      })}

      {/* SELECT attributes (Size, Material, Fit, etc.) */}
      {selectAttrs.map((attr) => {
        const activeIds = attr.values.filter((v) => selectedAvIds.includes(v.id));
        // Heuristic: if most values are short (≤3 chars) treat as size chips
        const avgLen =
          attr.values.reduce((sum, v) => sum + v.value.length, 0) /
          Math.max(attr.values.length, 1);
        const isSizeLike = avgLen <= 4;

        return (
          <Section
            key={attr.id}
            title={attr.name}
            badge={activeIds.length || 0}
            onClear={() => clearAttrGroup(attr.values)}
          >
            <div className={`flex flex-wrap gap-1.5`}>
              <CollapsibleList total={attr.values.length}>
                {attr.values.map((val) => {
                  const isSelected = selectedAvIds.includes(val.id);
                  if (isSizeLike) {
                    // Square size chip
                    return (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() => toggleAv(val.id)}
                        className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded border px-2 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border text-foreground-muted hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {val.value}
                      </button>
                    );
                  }
                  // Longer values: checkbox-row style
                  return (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => toggleAv(val.id)}
                      className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? "font-medium text-foreground"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected ? "border-foreground bg-foreground" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-background" />}
                      </span>
                      {val.value}
                    </button>
                  );
                })}
              </CollapsibleList>
            </div>
          </Section>
        );
      })}

      {/* TEXT attributes — searchable select */}
      {textAttrs.map((attr) => {
        const activeIds = attr.values.filter((v) => selectedAvIds.includes(v.id));
        return (
          <Section
            key={attr.id}
            title={attr.name}
            badge={activeIds.length || 0}
            onClear={() => clearAttrGroup(attr.values)}
          >
            <div className="flex flex-col gap-0.5">
              <CollapsibleList total={attr.values.length}>
                {attr.values.map((val) => {
                  const isSelected = selectedAvIds.includes(val.id);
                  return (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => toggleAv(val.id)}
                      className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? "font-medium text-foreground"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected ? "border-foreground bg-foreground" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-background" />}
                      </span>
                      {val.value}
                    </button>
                  );
                })}
              </CollapsibleList>
            </div>
          </Section>
        );
      })}

      {/* Tags */}
      {tags.length > 0 && (
        <Section
          title="Tags"
          defaultOpen={false}
          badge={currentTag ? 1 : 0}
          onClear={() => push({ tag: null })}
        >
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isSelected = currentTag === tag.slug;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => push({ tag: isSelected ? null : tag.slug })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-light transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeChips.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeChips.length}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{SidebarContent}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="relative flex w-[20rem] max-w-[90vw] flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-semibold text-foreground">
                Filters
                {activeChips.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {activeChips.length}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 text-foreground-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">{SidebarContent}</div>
            <div className="border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full rounded bg-foreground py-2.5 text-sm font-semibold text-background hover:opacity-80 transition-opacity"
              >
                Show Results
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
