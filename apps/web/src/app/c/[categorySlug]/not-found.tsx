import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto flex max-w-site flex-col items-center justify-center gap-6 px-gutter py-28 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Category not found</h1>
      <p className="max-w-sm text-sm text-foreground-muted">
        This category does not exist or may have been removed.
      </p>
      <Link
        href="/products"
        className="rounded bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Browse all products
      </Link>
    </div>
  );
}
