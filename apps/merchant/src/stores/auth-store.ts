"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface MerchantProfile {
  id: string;
  email: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  status: MerchantStatus;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  merchant: MerchantProfile | null;
  hasHydrated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; merchant: MerchantProfile }) => void;
  updateMerchant: (merchant: MerchantProfile) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      merchant: null,
      hasHydrated: false,
      setAuth: ({ accessToken, refreshToken, merchant }) => set({ accessToken, refreshToken, merchant }),
      updateMerchant: (merchant) => set({ merchant }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, merchant: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "mirakart-merchant-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
