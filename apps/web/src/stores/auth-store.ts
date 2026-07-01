import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  customer: CustomerProfile | null;
  /** True once zustand has finished reading persisted state from localStorage.
   *  Layouts that redirect unauthenticated users must wait for this — otherwise
   *  an already-logged-in user gets bounced during the brief pre-hydration tick
   *  where accessToken is still null. */
  hasHydrated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; customer: CustomerProfile }) => void;
  updateCustomer: (customer: CustomerProfile) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      customer: null,
      hasHydrated: false,
      setAuth: ({ accessToken, refreshToken, customer }) => set({ accessToken, refreshToken, customer }),
      updateCustomer: (customer) => set({ customer }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, customer: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "mirakart-web-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
