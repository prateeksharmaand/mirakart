"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  toast,
} from "@mirakart/ui";
import { useCart } from "../../hooks/use-cart";
import { fetchAddresses } from "../../lib/api/customers";
import { checkout, type PaymentMethod } from "../../lib/api/orders";
import { initiatePayment } from "../../lib/api/payments";
import { openRazorpayCheckout } from "../../lib/razorpay";
import { formatPrice } from "../../lib/format";
import { useAuthStore } from "../../stores/auth-store";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "CARD", label: "Credit / Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "NETBANKING", label: "Net Banking" },
  { value: "COD", label: "Cash on Delivery" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customer = useAuthStore((s) => s.customer);
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
  });

  const [addressId, setAddressId] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CARD");
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !addressId) {
      setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id);
    }
  }, [addresses, addressId]);

  const availableItems = cart?.items.filter((item) => item.isAvailable) ?? [];
  const subtotal = availableItems.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);

  async function handlePlaceOrder() {
    if (!addressId) {
      toast({ title: "Select a delivery address", variant: "danger" });
      return;
    }
    setIsPlacingOrder(true);
    try {
      const order = await checkout({ shippingAddressId: addressId, billingAddressId: addressId, paymentMethod });
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      if (paymentMethod === "COD") {
        router.push(`/checkout/confirmation/${order.id}`);
        return;
      }

      const initiation = await initiatePayment(order.id);
      await openRazorpayCheckout({
        key: initiation.keyId,
        amount: initiation.amount,
        currency: initiation.currency,
        order_id: initiation.providerOrderId,
        name: "Mirakart",
        description: `Order ${order.orderNumber}`,
        prefill: customer ? { name: `${customer.firstName} ${customer.lastName}`, email: customer.email } : undefined,
        handler: () => router.push(`/checkout/confirmation/${order.id}`),
        modal: {
          ondismiss: () => {
            toast({ title: "Payment not completed", description: "You can retry payment from your order details." });
            router.push(`/account/orders`);
          },
        },
      });
    } catch (error) {
      toast({ title: "Couldn't place order", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="mx-auto max-w-site px-gutter py-10">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!cart || availableItems.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add some items to your cart before checking out."
        action={
          <Button asChild>
            <a href="/">Continue shopping</a>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <h1 className="mb-8 text-3xl font-medium text-foreground">Checkout</h1>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              {!addresses || addresses.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  You don&apos;t have any saved addresses.{" "}
                  <a href="/account/addresses" className="text-primary">
                    Add one
                  </a>
                  .
                </p>
              ) : (
                <RadioGroup value={addressId} onValueChange={setAddressId}>
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value={address.id} className="mt-1" />
                      <span className="text-sm text-foreground">
                        <span className="font-medium">{address.fullName}</span> — {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                        {address.postalCode}, {address.country}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                {PAYMENT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-3">
                    <RadioGroupItem value={option.value} />
                    <Label className="cursor-pointer font-normal">{option.label}</Label>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border p-5 h-fit">
          <h2 className="text-sm font-medium text-foreground">Order Summary</h2>
          {availableItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground-muted">
                {item.product.name} × {item.quantity}
              </span>
              <span className="text-foreground">{formatPrice(item.currentPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 text-sm font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button size="lg" onClick={handlePlaceOrder} isLoading={isPlacingOrder} disabled={!addressId}>
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
}
