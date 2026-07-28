"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategorySpend } from "@/lib/queries";
import { formatCategory, formatCurrency } from "@/lib/format";

type Props = {
  data: CategorySpend[];
};

export function SpendByCategoryChart({ data }: Props) {
  const chartData = data.map((row) => ({
    category: formatCategory(row.category),
    total: row.total,
  }));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Spend by category
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: "var(--chart-muted)" }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--chart-muted)" }}
            tickFormatter={(value: number) => formatCurrency(value)}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              fontSize: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
            }}
          />
          <Bar dataKey="total" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} name="Spend" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
