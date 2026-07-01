import axios from "axios";
import type { ApiSuccessResponse } from "@mirakart/types";
import { apiClient } from "../api-client";
import type { CustomerProfile } from "../../stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CustomerAuthResult extends AuthTokens {
  customer: CustomerProfile;
}

export async function login(email: string, password: string): Promise<CustomerAuthResult> {
  const res = await axios.post<ApiSuccessResponse<CustomerAuthResult>>(`${API_URL}/auth/customer/login`, {
    email,
    password,
  });
  return res.data.data;
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<CustomerAuthResult> {
  const res = await axios.post<ApiSuccessResponse<CustomerAuthResult>>(`${API_URL}/auth/customer/register`, input);
  return res.data.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await axios.post(`${API_URL}/auth/forgot-password`, { email, principalType: "CUSTOMER" });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axios.post(`${API_URL}/auth/reset-password`, { token, principalType: "CUSTOMER", newPassword });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}
