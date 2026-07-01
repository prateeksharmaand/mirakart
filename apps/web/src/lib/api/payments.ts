import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";

export interface PaymentInitiation {
  provider: "razorpay";
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}

export async function initiatePayment(orderId: string): Promise<PaymentInitiation> {
  const res = await apiClient.post<ApiSuccessResponse<PaymentInitiation>>(`/payments/${orderId}/initiate`);
  return res.data.data;
}
