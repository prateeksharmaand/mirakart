"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, EmptyState, Skeleton, toast } from "@mirakart/ui";
import { AddressFormDialog } from "../../../components/address-form-dialog";
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from "../../../lib/api/customers";
import type { AddressInput } from "../../../lib/api/customers";
import type { CustomerAddress } from "../../../types/customer";

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: fetchAddresses });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<CustomerAddress | undefined>(undefined);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const createMutation = useMutation({ mutationFn: createAddress, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) => updateAddress(id, input),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Couldn't delete address", description: error.message, variant: "danger" }),
  });

  function openCreate() {
    setEditingAddress(undefined);
    setDialogOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    setEditingAddress(address);
    setDialogOpen(true);
  }

  async function handleSubmit(values: AddressInput) {
    if (editingAddress) {
      await updateMutation.mutateAsync({ id: editingAddress.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">Addresses</h1>
        <Button onClick={openCreate}>Add address</Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState title="No addresses yet" description="Add an address to speed up checkout." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{address.label || "Address"}</span>
                  {address.isDefault ? <Badge variant="primary">Default</Badge> : null}
                </div>
                <p className="text-sm text-foreground-muted">
                  {address.fullName}
                  <br />
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                  <br />
                  {address.phone}
                </p>
                <div className="mt-2 flex gap-3">
                  <button type="button" className="text-xs text-primary" onClick={() => openEdit(address)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() => deleteMutation.mutate(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        address={editingAddress}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
