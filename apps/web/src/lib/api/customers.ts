import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { CustomerAddress, CustomerProfileDetail } from "../../types/customer";

export async function fetchProfile(): Promise<CustomerProfileDetail> {
  const res = await apiClient.get<ApiSuccessResponse<CustomerProfileDetail>>("/customers/me");
  return res.data.data;
}

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<CustomerProfileDetail> {
  const res = await apiClient.patch<ApiSuccessResponse<CustomerProfileDetail>>("/customers/me", input);
  return res.data.data;
}

export async function fetchAddresses(): Promise<CustomerAddress[]> {
  const res = await apiClient.get<ApiSuccessResponse<CustomerAddress[]>>("/customers/me/addresses");
  return res.data.data;
}

export type AddressInput = Omit<CustomerAddress, "id">;

export async function createAddress(input: AddressInput): Promise<CustomerAddress> {
  const res = await apiClient.post<ApiSuccessResponse<CustomerAddress>>("/customers/me/addresses", input);
  return res.data.data;
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<CustomerAddress> {
  const res = await apiClient.patch<ApiSuccessResponse<CustomerAddress>>(`/customers/me/addresses/${id}`, input);
  return res.data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/customers/me/addresses/${id}`);
}
