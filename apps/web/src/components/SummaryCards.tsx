import type { SummaryStats } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";

type Props = {
  stats: SummaryStats;
};

export function SummaryCards({ stats }: Props) {
  const cards = [
    {
      label: "Total spend",
      value: formatCurrency(-stats.totalSpend),
      valueClassName: "text-[var(--chart-spend)]",
    },
    {
      label: "Total income",
      value: formatCurrency(stats.totalIncome),
      valueClassName: "text-[var(--chart-income)]",
    },
    {
      label: "Net",
      value: formatCurrency(stats.net),
      valueClassName: stats.net >= 0 ? "text-[var(--chart-income)]" : "text-[var(--chart-spend)]",
    },
    {
      label: "Transactions",
      value: stats.transactionCount.toLocaleString(),
      valueClassName: "text-[var(--text-primary)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {card.label}
          </div>
          <div
            className={`mt-2 text-lg font-semibold tabular-nums sm:text-2xl lg:text-3xl ${card.valueClassName}`}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
