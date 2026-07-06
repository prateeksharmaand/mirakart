"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp } from "lucide-react";
import { toast } from "@mirakart/ui";
import { fetchProductReviews, createReview } from "../lib/api/reviews";
import { useAuthStore } from "../stores/auth-store";
import { useRouter } from "next/navigation";

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
}

function StarRating({
  rating,
  interactive = false,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
        >
          <Star
            className="h-4 w-4 transition-colors"
            fill={n <= (hovered || rating) ? "#F59E0B" : "none"}
            stroke={n <= (hovered || rating) ? "#F59E0B" : "currentColor"}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-4 shrink-0 text-right text-foreground-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-foreground-muted">{count}</span>
    </div>
  );
}

export function ProductReviews({ productId, productSlug }: ProductReviewsProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", productId, page],
    queryFn: () => fetchProductReviews(productId, page),
    staleTime: 60_000,
  });

  const submitMutation = useMutation({
    mutationFn: () => createReview(productId, { rating, title: title || undefined, body: body || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      setShowForm(false);
      setRating(0);
      setTitle("");
      setBody("");
      toast({ title: "Review submitted", variant: "success" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "danger" }),
  });

  const summary = data?.summary;
  const reviews = data?.data ?? [];
  const meta = data?.meta;

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    label: String(n),
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Summary */}
      {summary && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-12">
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-bold text-foreground">
              {summary.averageRating.toFixed(1)}
            </span>
            <StarRating rating={Math.round(summary.averageRating)} />
            <span className="text-xs text-foreground-muted">
              {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 max-w-xs">
            {dist.map((d) => (
              <RatingBar key={d.label} label={d.label} count={d.count} total={reviews.length} />
            ))}
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/login?next=/p/${productSlug}`);
                  return;
                }
                setShowForm((s) => !s);
              }}
              className="rounded border border-foreground px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Write a Review
            </button>
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-background-light p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Your Review</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Rating *</label>
              <StarRating rating={rating} interactive onRate={setRating} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Review</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell others about your experience"
                rows={4}
                className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={rating === 0 || submitMutation.isPending}
                className="rounded bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {submitMutation.isPending ? "Submitting…" : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded bg-border" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {reviews.map((review) => (
            <div key={review.id} className="py-5">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.verifiedPurchase && (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <ThumbsUp className="h-2.5 w-2.5" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <p className="mt-1 text-sm font-semibold text-foreground">{review.title}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {review.body && (
                <p className="text-sm leading-relaxed text-foreground-muted">{review.body}</p>
              )}
              <p className="mt-2 text-xs text-foreground-muted">
                — {review.customer.firstName} {review.customer.lastName[0]}.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
                p === page
                  ? "bg-foreground text-background"
                  : "border border-border text-foreground hover:bg-background-light"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
