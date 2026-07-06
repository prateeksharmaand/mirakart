"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "@mirakart/ui";
import { fetchProductQueries, submitQuery } from "../lib/api/queries";
import { useAuthStore } from "../stores/auth-store";
import { useRouter } from "next/navigation";

interface ProductQueriesProps {
  productId: string;
  productSlug: string;
}

export function ProductQueries({ productId, productSlug }: ProductQueriesProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["product-queries", productId],
    queryFn: () => fetchProductQueries(productId),
    staleTime: 60_000,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitQuery(productId, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-queries", productId] });
      setShowForm(false);
      setQuestion("");
      toast({ title: "Question submitted", description: "We'll notify you when answered", variant: "success" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "danger" }),
  });

  const answeredQueries = queries.filter((q) => q.answer);

  return (
    <div className="flex flex-col gap-6">
      {/* Ask a Question button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-muted">
          {answeredQueries.length > 0
            ? `${answeredQueries.length} question${answeredQueries.length !== 1 ? "s" : ""} answered`
            : "No questions yet — be the first!"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              router.push(`/login?next=/p/${productSlug}`);
              return;
            }
            setShowForm((s) => !s);
          }}
          className="flex items-center gap-2 rounded border border-foreground px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          <MessageCircle className="h-4 w-4" />
          Ask a Question
        </button>
      </div>

      {/* Ask form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-background-light p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Your Question</h3>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            rows={3}
            minLength={10}
            className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={question.length < 10 || submitMutation.isPending}
              className="rounded bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Question"}
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
      )}

      {/* Q&A list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-border" />
          ))}
        </div>
      ) : answeredQueries.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 text-border" />
          <p className="text-sm text-foreground-muted">No answered questions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {answeredQueries.map((q) => (
            <div key={q.id} className="py-4">
              <button
                type="button"
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <p className="text-sm font-medium text-foreground">Q: {q.question}</p>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-foreground-muted transition-transform ${
                    expanded === q.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expanded === q.id && q.answer && (
                <div className="mt-3 rounded bg-background-light px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Seller Answer
                  </p>
                  <p className="mt-1 text-sm text-foreground">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
