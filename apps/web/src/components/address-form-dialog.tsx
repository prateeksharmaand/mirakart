"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@mirakart/ui";
import { AddressForm } from "./address-form";
import type { AddressInput } from "../lib/api/customers";
import type { CustomerAddress } from "../types/customer";

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: CustomerAddress;
  onSubmit: (values: AddressInput) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add address"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <AddressForm
            key={address?.id ?? "new"}
            address={address}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
