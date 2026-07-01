"use client";

export function NewsletterForm({ className }: { className?: string }) {
  return (
    <form
      className={className}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Enter your email address"
        className="h-form flex-1 rounded border border-border bg-background-light px-4 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-border-form-active"
      />
      <button type="submit" className="btn-primary shrink-0 px-5">
        Subscribe
      </button>
    </form>
  );
}
