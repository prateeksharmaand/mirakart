"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X, SlidersHorizontal, Check } from "lucide-react";
import type { Category, Brand } from "../types/catalog";
import type { AttributeFilter, Tag } from "../lib/api/catalog";

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  tags: Tag[];
  attributes: AttributeFilter[];
  hideCategoryFilter?: boolean;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-foreground"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  categories,
  brands,
  tags,
  attributes,
  hideCategoryFilter = false,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [brandSearch, setBrandSearch] = React.useState("");

  // --- URL state helpers ---
  const currentCategoryId = searchParams.get("categoryId") ?? "";
  const currentBrandId = searchParams.get("brandId") ?? "";
  const currentTag = searchParams.get("tag") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const [draftMin, setDraftMin] = React.useState(currentMinPrice);
  const [draftMax, setDraftMax] = React.useState(currentMaxPrice);
  const selectedAvIds = React.useMemo(() => {
    const raw = searchParams.get("av");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

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

  function clearAttrGroup(attrValues: AttributeFilter["values"]) {
    const idsToRemove = new Set(attrValues.map((v) => v.id));
    const next = selectedAvIds.filter((id) => !idsToRemove.has(id));
    push({ av: next.length > 0 ? next.join(",") : null });
  }

  function applyPrice() {
    push({ minPrice: draftMin || null, maxPrice: draftMax || null });
  }

  const colorAttrs = attributes.filter((a) => a.type === "COLOR" && a.values.length > 0);
  const selectAttrs = attributes.filter((a) => a.type === "SELECT" && a.values.length > 0);

  const activeCount = [
    currentCategoryId,
    currentBrandId,
    currentTag,
    currentMinPrice || currentMaxPrice,
    selectedAvIds.length > 0 ? "av" : "",
  ].filter(Boolean).length;

  function clearAll() {
    router.push("?");
    setDraftMin("");
    setDraftMax("");
  }

  const SidebarContent = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Filters
        </span>
        {activeCount > 0 && (
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

      {/* Price */}
      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={draftMin}
            onChange={(e) => setDraftMin(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
          />
          <span className="text-foreground-muted">–</span>
          <input
            type="number"
            placeholder="Max"
            value={draftMax}
            onChange={(e) => setDraftMax(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full rounded bg-foreground py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
        >
          Apply
        </button>
        {(currentMinPrice || currentMaxPrice) && (
          <button
            type="button"
            onClick={() => { setDraftMin(""); setDraftMax(""); push({ minPrice: null, maxPrice: null }); }}
            className="mt-1 text-xs text-primary hover:underline"
          >
            Clear price
          </button>
        )}
      </Section>

      {/* Categories */}
      {!hideCategoryFilter && categories.length > 0 && (
        <Section title="Categories">
          <div className="flex flex-col gap-1.5">
            {categories.map((cat) => {
              const active = currentCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => push({ categoryId: active ? null : cat.id })}
                  className={`flex items-center justify-between rounded px-2 py-1 text-sm transition-colors ${
                    active
                      ? "bg-foreground text-background font-medium"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                  }`}
                >
                  <span>{cat.name}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <Section title="Brands">
          {brands.length > 6 && (
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="mb-2 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
            />
          )}
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
            {brands
              .filter((b) =>
                brandSearch.length === 0 ||
                b.name.toLowerCase().includes(brandSearch.toLowerCase())
              )
              .map((brand) => {
                const active = currentBrandId === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => push({ brandId: active ? null : brand.id })}
                    className={`flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors ${
                      active
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-light"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active ? "border-background bg-background" : "border-border"
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5 text-foreground" />}
                    </span>
                    {brand.name}
                  </button>
                );
              })}
          </div>
        </Section>
      )}

      {/* Color attributes */}
      {colorAttrs.map((attr) => {
        const hasActive = attr.values.some((v) => selectedAvIds.includes(v.id));
        return (
          <Section key={attr.id} title={attr.name}>
            <div className="flex flex-wrap gap-2.5">
              {attr.values.map((val) => {
                const isSelected = selectedAvIds.includes(val.id);
                return (
                  <button
                    key={val.id}
                    type="button"
                    title={val.value}
                    onClick={() => toggleAv(val.id)}
                    className={`relative h-8 w-8 rounded-full border-2 transition-all ${
                      isSelected
                        ? "border-primary scale-110 shadow-sm"
                        : "border-transparent hover:border-foreground-muted"
                    }`}
                    style={{ backgroundColor: val.colorHex ?? "#ccc" }}
                  >
                    <span className="sr-only">{val.value}</span>
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white drop-shadow">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {hasActive && (
              <button
                type="button"
                onClick={() => clearAttrGroup(attr.values)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear {attr.name}
              </button>
            )}
          </Section>
        );
      })}

      {/* SELECT attributes (sizes, etc.) */}
      {selectAttrs.map((attr) => {
        const hasActive = attr.values.some((v) => selectedAvIds.includes(v.id));
        return (
          <Section key={attr.id} title={attr.name}>
            <div className="flex flex-wrap gap-1.5">
              {attr.values.map((val) => {
                const isSelected = selectedAvIds.includes(val.id);
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => toggleAv(val.id)}
                    className={`min-w-[2.25rem] rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground-muted hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
            {hasActive && (
              <button
                type="button"
                onClick={() => clearAttrGroup(attr.values)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear {attr.name}
              </button>
            )}
          </Section>
        );
      })}

      {/* Tags */}
      {tags.length > 0 && (
        <Section title="Tags" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isSelected = currentTag === tag.slug;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => push({ tag: isSelected ? null : tag.slug })}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
      {/* Mobile trigger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-light transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{SidebarContent}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="relative flex w-72 max-w-full flex-col overflow-y-auto bg-background p-5 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-foreground">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-sm p-1 text-foreground-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {SidebarContent}
            <div className="sticky bottom-0 mt-4 border-t border-border bg-background pt-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full rounded bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
              >
                Show Results
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
