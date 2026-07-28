"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlySpend } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";

type Props = {
  data: MonthlySpend[];
};

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return MONTH_LABEL_FORMAT.format(new Date(year ?? 0, (monthNumber ?? 1) - 1, 1));
}

export function MonthlySpendChart({ data }: Props) {
  const chartData = data.map((row) => ({
    month: formatMonthLabel(row.month),
    Spend: row.spend,
    Income: row.income,
  }));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Spend vs income by month
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--chart-muted)" }} />
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
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          <Bar dataKey="Spend" fill="var(--chart-spend)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
