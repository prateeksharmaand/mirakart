import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";

export interface ReviewAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customer: ReviewAuthor;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface ReviewsResponse {
  data: Review[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
  summary: ReviewSummary;
}

export async function fetchProductReviews(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ReviewsResponse> {
  const res = await apiClient.get<ApiSuccessResponse<ReviewsResponse>>(
    `/products/${productId}/reviews?page=${page}&limit=${limit}`,
  );
  return res.data.data as unknown as ReviewsResponse;
}

export async function createReview(
  productId: string,
  data: { rating: number; title?: string; body?: string },
): Promise<Review> {
  const res = await apiClient.post<ApiSuccessResponse<Review>>(
    `/products/${productId}/reviews`,
    data,
  );
  return res.data.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`);
}
