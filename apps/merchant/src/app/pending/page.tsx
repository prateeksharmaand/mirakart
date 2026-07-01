"use client";

import { useRouter } from "next/navigation";
import { Button } from "@mirakart/ui";
import { Clock } from "lucide-react";
import { useAuthStore } from "../../stores/auth-store";
import { merchantLogout } from "../../lib/api/auth";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { merchant, refreshToken, clearAuth } = useAuthStore();

  async function handleLogout() {
    try { if (refreshToken) await merchantLogout(refreshToken); } catch { /* swallow */ }
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50">
          <Clock className="h-10 w-10 text-yellow-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Awaiting Approval</h1>
        <p className="mb-6 text-muted-foreground">
          Thanks for registering <strong>{merchant?.storeName}</strong>! Our team is reviewing your application.
          You'll receive an email notification once your account is approved.
        </p>
        <div className="rounded-xl border border-border bg-white p-6 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Our team reviews your store details</li>
            <li>You may be asked to submit verification documents</li>
            <li>Once approved, you'll have full access to sell on Mirakart</li>
          </ol>
        </div>
        <Button variant="outline" onClick={handleLogout} className="mt-6">Sign out</Button>
      </div>
    </div>
  );
}
