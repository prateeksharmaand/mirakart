import { apiClient } from "../api-client";
import type { AdminProfile } from "../../stores/auth-store";

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await apiClient.post("/auth/admin/login", { email, password });
  return res.data.data as AdminLoginResponse;
}

export async function adminLogout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}
