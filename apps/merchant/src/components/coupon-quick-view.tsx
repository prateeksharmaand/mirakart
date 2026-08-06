"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Dialog, DialogContent, DialogTitle, Skeleton } from "@mirakart/ui";
import { getCoupon } from "../lib/api/coupons";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

function formatDiscount(discountType: string, discountValue: number) {
  return discountType === "PERCENTAGE" ? `${discountValue}% off` : `₹${discountValue} off`;
}

interface Props {
  couponId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CouponQuickView({ couponId, onOpenChange }: Props) {
  const open = couponId !== null;

  const { data: coupon, isLoading } = useQuery({
    queryKey: ["merchant-coupon-quick-view", couponId],
    queryFn: () => getCoupon(couponId!),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {isLoading || !coupon ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <DialogTitle className="font-mono text-xl font-semibold text-foreground">{coupon.code}</DialogTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={coupon.isActive ? "success" : "default"}>{coupon.isActive ? "Active" : "Inactive"}</Badge>
                <Badge variant="default">{formatDiscount(coupon.discountType, coupon.discountValue)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {coupon.maxDiscountAmount != null && (
                <div><p className="text-xs text-muted-foreground">Max Discount</p><p>₹{coupon.maxDiscountAmount}</p></div>
              )}
              {coupon.minOrderValue != null && (
                <div><p className="text-xs text-muted-foreground">Min Order Value</p><p>₹{coupon.minOrderValue}</p></div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Usage</p>
                <p>{coupon.usageLimit ? `${coupon.usedCount} / ${coupon.usageLimit}` : `${coupon.usedCount} (no limit)`}</p>
              </div>
              {coupon.perCustomerLimit != null && (
                <div><p className="text-xs text-muted-foreground">Per Customer Limit</p><p>{coupon.perCustomerLimit}</p></div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Starts</p>
                <p>{formatDate(coupon.startsAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p>{formatDate(coupon.expiresAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p>{formatDate(coupon.createdAt)}</p>
              </div>
            </div>

            <Link
              href={`/coupons/${coupon.id}`}
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Edit full details →
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
