"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button, Input, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { listMerchantQueries, answerQuery } from "../../../lib/api/queries";
import Link from "next/link";

export default function QueriesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState<"all" | "unanswered">("unanswered");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-queries", filter],
    queryFn: () => listMerchantQueries({
      limit: 50,
      answered: filter === "all" ? undefined : false,
    }),
    staleTime: 30_000,
  });

  const queries = data?.data ?? [];
  const unansweredCount = queries.filter((q) => !q.answer).length;

  async function handleAnswer(queryId: string) {
    const answer = answers[queryId]?.trim();
    if (!answer || answer.length < 5) {
      toast({ title: "Answer must be at least 5 characters", variant: "danger" });
      return;
    }
    setSubmitting((s) => ({ ...s, [queryId]: true }));
    try {
      await answerQuery(queryId, answer);
      qc.invalidateQueries({ queryKey: ["merchant-queries"] });
      setAnswers((a) => { const n = { ...a }; delete n[queryId]; return n; });
      setExpanded(null);
      toast({ title: "Answer submitted", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Failed to submit answer", description: (e as Error).message, variant: "danger" });
    } finally {
      setSubmitting((s) => ({ ...s, [queryId]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customer Q&A"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Customer Q&A" }]}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-0">
        <button
          type="button"
          onClick={() => setFilter("unanswered")}
          className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
            filter === "unanswered"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Unanswered
          {unansweredCount > 0 && filter !== "unanswered" && (
            <span className="ml-2 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{unansweredCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
            filter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          All Questions
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-border" />
          <p className="text-sm font-medium text-foreground">
            {filter === "unanswered" ? "No unanswered questions" : "No questions yet"}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            Customer questions about your products will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {queries.map((q) => {
            const isExpanded = expanded === q.id;
            const isAnswered = !!q.answer;
            const askerName = q.customer?.name ?? q.guestName ?? "Anonymous";
            const currentAnswer = answers[q.id] ?? "";

            return (
              <div
                key={q.id}
                className={`rounded-xl border bg-white p-5 ${
                  isAnswered ? "border-border" : "border-amber-300"
                }`}
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs text-foreground-muted">{askerName}</span>
                      <span className="text-foreground-muted">·</span>
                      <Link
                        href={`/products/${q.product.id}/edit`}
                        className="text-xs text-primary hover:underline truncate max-w-[200px]"
                      >
                        {q.product.name}
                      </Link>
                      <span className="text-foreground-muted">·</span>
                      <span className="text-xs text-foreground-muted">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                      {isAnswered && (
                        <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Answered
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : q.id)}
                    className="shrink-0 rounded p-1 text-foreground-muted hover:text-foreground hover:bg-background-light transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded: existing answer or answer form */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    {isAnswered ? (
                      <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-success">Your Answer</p>
                        <p className="text-sm text-foreground">{q.answer}</p>
                        <p className="mt-2 text-[11px] text-foreground-muted">
                          Answered {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-foreground-muted">Write your answer (min 5 characters):</p>
                        <textarea
                          value={currentAnswer}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                          placeholder="Type your answer here…"
                          rows={3}
                          className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAnswer(q.id)}
                            isLoading={submitting[q.id]}
                            disabled={currentAnswer.trim().length < 5}
                          >
                            Submit Answer
                          </Button>
                          <button
                            type="button"
                            onClick={() => setExpanded(null)}
                            className="text-sm text-foreground-muted hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick answer for unanswered — show inline when not expanded */}
                {!isAnswered && !isExpanded && (
                  <button
                    type="button"
                    onClick={() => setExpanded(q.id)}
                    className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Answer this question →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
