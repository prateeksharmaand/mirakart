"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { getCustomer, suspendCustomer, activateCustomer } from "../../../../lib/api/customers";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = React.useState<"suspend" | "activate" | null>(null);

  const { data: customer, isLoading } = useQuery({ queryKey: ["customer", params.id], queryFn: () => getCustomer(params.id) });

  const mutation = useMutation({
    mutationFn: () => confirmAction === "suspend" ? suspendCustomer(params.id) : activateCustomer(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", params.id] });
      toast({ title: confirmAction === "suspend" ? "Customer suspended" : "Customer activated", variant: "success" });
      setConfirmAction(null);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Customers", href: "/customers" }, { label: customer.firstName }]}
        action={
          customer.status === "ACTIVE"
            ? <Button variant="danger" onClick={() => setConfirmAction("suspend")}>Suspend</Button>
            : <Button onClick={() => setConfirmAction("activate")}>Activate</Button>
        }
      />
      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={customer.status === "ACTIVE" ? "success" : "danger"}>{customer.status}</Badge></div>
        <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{customer.email}</p></div>
        <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm">{customer.phone ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p></div>
      </div>
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === "suspend" ? "Suspend customer" : "Activate customer"}
        description={confirmAction === "suspend" ? "This customer will not be able to place orders." : "This customer will regain access."}
        confirmLabel={confirmAction === "suspend" ? "Suspend" : "Activate"}
        variant={confirmAction === "suspend" ? "danger" : "primary"}
        isLoading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
