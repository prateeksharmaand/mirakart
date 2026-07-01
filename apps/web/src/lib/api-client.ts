"use client";

import type { AxiosError} from "axios";
import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@mirakart/types";
import { useAuthStore } from "../stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Client-side instance for authenticated/interactive calls (cart, checkout,
 * account, auth). Responses keep the full { success, data, meta } envelope —
 * callers in lib/api/*.ts unwrap `.data.data`/`.data.meta` explicitly rather
 * than relying on an interceptor to reshape the response generically.
 */
export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAuth, customer, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const tokens = response.data.data;
    if (customer) {
      setAuth({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, customer });
    }
    return tokens.accessToken as string;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }

    const message = error.response?.data?.error?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
