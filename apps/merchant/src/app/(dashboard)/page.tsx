"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, RotateCcw, Package, Clock, Box, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../components/page-header";
import { getMerchantSalesSummary, getMerchantTopProducts, getOrderStatusSummary } from "../../lib/api/dashboard";
import { useAuthStore } from "../../stores/auth-store";

function StatsCard({ title, value, icon: Icon, iconColor = "text-primary", isLoading }: {
  title: string; value: string | number; icon: React.ElementType; iconColor?: string; isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? <div className="mt-1 h-7 w-20 animate-pulse rounded bg-gray-100" /> : <p className="mt-1 text-2xl font-semibold">{value}</p>}
        </div>
        <div className={`rounded-lg bg-gray-50 p-3 ${iconColor}`}><Icon className="h-6 w-6" /></div>
      </div>
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantDashboardPage() {
  const { merchant } = useAuthStore();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["merchant-summary"],
    queryFn: () => getMerchantSalesSummary(),
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["merchant-top-products"],
    queryFn: () => getMerchantTopProducts({ limit: 6 }),
  });

  const { data: orderStatusSummary, isLoading: orderStatusLoading } = useQuery({
    queryKey: ["merchant-order-status-summary"],
    queryFn: getOrderStatusSummary,
  });

  const chartData = (topProducts ?? []).map((p) => ({
    name: p.product?.name?.slice(0, 18) ?? "Unknown",
    revenue: p.revenue,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Welcome, ${merchant?.storeName ?? "Seller"}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Total Revenue" value={summary ? formatCurrency(summary.totalRevenue) : "—"} icon={DollarSign} iconColor="text-green-600" isLoading={summaryLoading} />
        <StatsCard title="Orders" value={summary?.totalOrders ?? "—"} icon={ShoppingCart} isLoading={summaryLoading} />
        <StatsCard title="Returns" value={summary?.totalReturns ?? "—"} icon={RotateCcw} iconColor="text-orange-500" isLoading={summaryLoading} />
        <StatsCard title="Pending Orders" value={orderStatusSummary?.pending ?? "—"} icon={Clock} iconColor="text-amber-600" isLoading={orderStatusLoading} />
        <StatsCard title="Processing" value={orderStatusSummary?.processing ?? "—"} icon={Package} iconColor="text-blue-600" isLoading={orderStatusLoading} />
        <StatsCard title="Packed" value={orderStatusSummary?.packed ?? "—"} icon={Box} iconColor="text-purple-600" isLoading={orderStatusLoading} />
        <StatsCard title="Shipped" value={orderStatusSummary?.shipped ?? "—"} icon={Truck} iconColor="text-teal-600" isLoading={orderStatusLoading} />
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold">Top Products by Revenue</h2>
        {productsLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No sales data yet — start listing products!</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#ee403d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
