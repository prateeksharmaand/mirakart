"use client";

import type { AxiosError } from "axios";
import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@mirakart/types";
import { useAuthStore } from "../stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAuth, admin, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const tokens = res.data.data as { accessToken: string; refreshToken: string };
    if (admin) setAuth({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, admin });
    return tokens.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = error.response?.data as any;
    const message = data?.error?.message ?? data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
