import { apiClient } from "../api-client";
import type { MerchantProfile } from "../../stores/auth-store";

export interface MerchantLoginResponse {
  accessToken: string;
  refreshToken: string;
  merchant: MerchantProfile;
}

export async function merchantLogin(email: string, password: string): Promise<MerchantLoginResponse> {
  const res = await apiClient.post("/auth/merchant/login", { email, password });
  return res.data.data as MerchantLoginResponse;
}

export async function merchantRegister(data: {
  storeName: string;
  email: string;
  password: string;
  phone: string;
}): Promise<MerchantLoginResponse> {
  const res = await apiClient.post("/auth/merchant/register", data);
  return res.data.data as MerchantLoginResponse;
}

export async function merchantLogout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}
