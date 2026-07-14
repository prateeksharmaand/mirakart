"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  toast,
} from "@mirakart/ui";
import { AddressForm } from "../../components/address-form";
import { CheckoutSteps } from "../../components/checkout-steps";
import { useCart } from "../../hooks/use-cart";
import { createAddress, fetchAddresses } from "../../lib/api/customers";
import type { AddressInput } from "../../lib/api/customers";
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
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | "">("CARD");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [showTermsError, setShowTermsError] = React.useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  React.useEffect(() => {
    if (!addresses) return;
    if (addresses.length === 0) {
      setShowAddressForm(true);
      return;
    }
    setShowAddressForm(false);
    setAddressId((prev) => (prev && addresses.some((a) => a.id === prev) ? prev : addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id));
  }, [addresses]);

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (address) => {
      queryClient.setQueryData<typeof addresses>(["addresses"], (old) => [...(old ?? []), address]);
      setAddressId(address.id);
      setShowAddressForm(false);
    },
  });

  const availableItems = cart?.items.filter((item) => item.isAvailable) ?? [];
  const subtotal = availableItems.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);

  async function handleCreateAddress(values: AddressInput) {
    await createAddressMutation.mutateAsync(values);
  }

  async function handlePlaceOrder() {
    if (!addressId) {
      toast({ title: "Add a delivery address", variant: "danger" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Select a payment method", variant: "danger" });
      return;
    }
    if (!agreedToTerms) {
      setShowTermsError(true);
      toast({ title: "Please accept the terms and conditions", variant: "danger" });
      return;
    }
    setShowTermsError(false);
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

  const hasAddresses = Boolean(addresses && addresses.length > 0);

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <CheckoutSteps current="checkout" />
      <h1 className="mb-8 text-3xl font-medium text-foreground">Checkout</h1>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Billing details</CardTitle>
              {!showAddressForm && hasAddresses ? (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  + Add new address
                </button>
              ) : null}
            </CardHeader>
            <CardContent>
              {showAddressForm || !hasAddresses ? (
                <AddressForm
                  onSubmit={handleCreateAddress}
                  onCancel={hasAddresses ? () => setShowAddressForm(false) : undefined}
                  submitLabel="Use this address"
                />
              ) : (
                <RadioGroup value={addressId} onValueChange={setAddressId}>
                  {addresses!.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value={address.id} className="mt-1" />
                      <span className="text-sm text-foreground">
                        <span className="font-medium">{address.fullName}</span> — {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                        {address.postalCode}, {address.country}
                        <br />
                        <span className="text-foreground-muted">{address.phone}</span>
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
                    <span className="cursor-pointer text-sm font-normal text-foreground">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border p-5 h-fit">
          <h2 className="text-base font-medium text-foreground">Your order</h2>
          <div className="flex flex-col divide-y divide-border">
            {availableItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span className="text-foreground-muted">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="shrink-0 text-foreground">{formatPrice(item.currentPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground-muted">Subtotal</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <p className="border-t border-border pt-4 text-xs leading-relaxed text-foreground-muted">
            Your personal data will be used to process your order, support your experience throughout this
            website, and for other purposes described in our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              privacy policy
            </Link>
            .
          </p>

          <label className="flex items-start gap-2 text-xs text-foreground">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(checked === true);
                if (checked === true) setShowTermsError(false);
              }}
              className="mt-0.5"
            />
            <span>
              I have read and agree to the website{" "}
              <Link href="/terms" className="text-primary hover:underline">
                terms and conditions
              </Link>{" "}
              <span className="text-danger">*</span>
            </span>
          </label>
          {showTermsError ? (
            <p className="text-xs text-danger">
              Please read and accept the terms and conditions to proceed with your order.
            </p>
          ) : null}

          <Button
            size="lg"
            onClick={handlePlaceOrder}
            isLoading={isPlacingOrder}
            disabled={!addressId || showAddressForm}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
}
