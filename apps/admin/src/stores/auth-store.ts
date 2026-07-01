"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  role?: { id: string; name: string } | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  admin: AdminProfile | null;
  hasHydrated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; admin: AdminProfile }) => void;
  updateAdmin: (admin: AdminProfile) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      admin: null,
      hasHydrated: false,
      setAuth: ({ accessToken, refreshToken, admin }) => set({ accessToken, refreshToken, admin }),
      updateAdmin: (admin) => set({ admin }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, admin: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "mirakart-admin-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
