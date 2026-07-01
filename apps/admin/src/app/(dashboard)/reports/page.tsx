"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../../components/page-header";
import { StatsCard } from "../../../components/stats-card";
import { DollarSign, ShoppingCart, RotateCcw, Package } from "lucide-react";
import { getAdminSalesSummary, getTopProducts } from "../../../lib/api/reports";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
];

export default function ReportsPage() {
  const [rangeDays, setRangeDays] = React.useState(30);

  function getRange() {
    if (rangeDays === 0) return {};
    const to = new Date();
    const from = new Date(Date.now() - rangeDays * 86400000);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports-summary", rangeDays],
    queryFn: () => getAdminSalesSummary(getRange()),
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["reports-top-products", rangeDays],
    queryFn: () => getTopProducts({ ...getRange(), limit: 10 }),
  });

  const chartData = (topProducts ?? []).map((p) => ({
    name: p.product?.name?.slice(0, 20) ?? "Unknown",
    revenue: p.revenue,
    units: p.unitsSold,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports & Analytics"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }]}
        action={
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
          >
            {RANGES.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Total Revenue" value={summary ? formatCurrency(summary.totalRevenue) : "—"} icon={DollarSign} isLoading={summaryLoading} iconColor="text-green-600" />
        <StatsCard title="Total Orders" value={summary?.totalOrders ?? "—"} icon={ShoppingCart} isLoading={summaryLoading} />
        <StatsCard title="Total Returns" value={summary?.totalReturns ?? "—"} icon={RotateCcw} isLoading={summaryLoading} iconColor="text-orange-500" />
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold">Top Products by Revenue</h2>
        {productsLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#ee403d" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {topProducts && topProducts.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Top Products Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Product</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Units Sold</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Revenue</th>
              </tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product?.id ?? i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{p.product?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-right">{p.unitsSold}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
