import type { ApiResponse, PaginationMeta } from "@mirakart/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Server-side fetch for PUBLIC, unauthenticated reads only (product/category
 * listings, banners, ...) — used inside async Server Components so those
 * pages are server-rendered and crawlable. Authenticated/interactive data
 * (cart, checkout, account) goes through lib/api-client.ts instead.
 */
export async function fetchPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await fetchPublicEnvelope<T>(path, init);
  return data;
}

export async function fetchPublicEnvelope<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: { revalidate: 60, ...(init as { next?: { revalidate?: number } } | undefined)?.next },
  });

  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(body.error.message);
  }
  return { data: body.data, meta: body.meta };
}
