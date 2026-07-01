"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, Store, Users, Package, RotateCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../components/page-header";
import { StatsCard } from "../../components/stats-card";
import {
  getAdminSalesSummary,
  getTopProducts,
  getMerchantCount,
  getCustomerCount,
} from "../../lib/api/reports";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => getAdminSalesSummary(),
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => getTopProducts({ limit: 8 }),
  });

  const { data: merchantCount, isLoading: merchantLoading } = useQuery({
    queryKey: ["merchant-count"],
    queryFn: getMerchantCount,
  });

  const { data: customerCount, isLoading: customerLoading } = useQuery({
    queryKey: ["customer-count"],
    queryFn: getCustomerCount,
  });

  const chartData = (topProducts ?? []).map((p) => ({
    name: p.product?.name?.slice(0, 18) ?? "Unknown",
    revenue: p.revenue,
    units: p.unitsSold,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Total Revenue"
          value={summary ? formatCurrency(summary.totalRevenue) : "—"}
          icon={DollarSign}
          isLoading={summaryLoading}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Orders"
          value={summary?.totalOrders ?? "—"}
          icon={ShoppingCart}
          isLoading={summaryLoading}
        />
        <StatsCard
          title="Total Returns"
          value={summary?.totalReturns ?? "—"}
          icon={RotateCcw}
          isLoading={summaryLoading}
          iconColor="text-orange-500"
        />
        <StatsCard
          title="Merchants"
          value={merchantCount ?? "—"}
          icon={Store}
          isLoading={merchantLoading}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Customers"
          value={customerCount ?? "—"}
          icon={Users}
          isLoading={customerLoading}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Top Products Tracked"
          value={topProducts?.length ?? "—"}
          icon={Package}
          isLoading={productsLoading}
          iconColor="text-slate-600"
        />
      </div>

      {/* Top Products Chart */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-foreground">Top Products by Revenue</h2>
        {productsLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
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
