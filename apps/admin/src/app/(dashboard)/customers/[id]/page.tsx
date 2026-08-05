"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Mail, Phone } from "lucide-react";
import { Badge, Button, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { getCustomer, suspendCustomer, activateCustomer } from "../../../../lib/api/customers";

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive", BLOCKED: "Suspended" };

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = React.useState<"suspend" | "activate" | null>(null);

  const { data: customer, isLoading } = useQuery({ queryKey: ["customer", params.id], queryFn: () => getCustomer(params.id) });

  const mutation = useMutation({
    mutationFn: () => confirmAction === "suspend" ? suspendCustomer(params.id) : activateCustomer(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", params.id] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: confirmAction === "suspend" ? "Customer suspended" : "Customer activated", variant: "success" });
      setConfirmAction(null);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Customers", href: "/customers" }, { label: customer.firstName }]}
        action={
          customer.status === "ACTIVE"
            ? <Button variant="danger" onClick={() => setConfirmAction("suspend")}>Suspend</Button>
            : <Button onClick={() => setConfirmAction("activate")}>Activate</Button>
        }
      />
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary">
            {customer.firstName.slice(0, 1)}{customer.lastName.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-foreground">{customer.firstName} {customer.lastName}</p>
              <Badge variant={customer.status === "ACTIVE" ? "success" : "danger"}>{STATUS_LABEL[customer.status] ?? customer.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a href={`mailto:${customer.email}`} className="text-sm hover:text-primary hover:underline">{customer.email}</a>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              {customer.phone ? (
                <a href={`tel:${customer.phone}`} className="text-sm hover:text-primary hover:underline">{customer.phone}</a>
              ) : (
                <p className="text-sm">—</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
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
