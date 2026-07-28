import type { RecentTransaction } from "@/lib/queries";
import { formatCategory, formatCurrency } from "@/lib/format";

type Props = {
  transactions: RecentTransaction[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function RecentTransactionsTable({ transactions }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <h2 className="px-5 pt-5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Recent transactions
      </h2>
      <div className="mt-3 overflow-x-auto pb-1">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
              <th className="px-5 py-2.5 font-medium">Merchant</th>
              <th className="px-5 py-2.5 font-medium">Date</th>
              <th className="px-5 py-2.5 font-medium">Category</th>
              <th className="px-5 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="odd:bg-transparent even:bg-[var(--row-alt)]">
                <td className="px-5 py-3 text-[var(--text-primary)]">{tx.merchant}</td>
                <td className="px-5 py-3 text-[var(--text-secondary)]">
                  {dateFormatter.format(tx.date)}
                </td>
                <td className="px-5 py-3 text-[var(--text-secondary)]">
                  {formatCategory(tx.category)}
                </td>
                <td
                  className={`px-5 py-3 text-right tabular-nums ${
                    tx.amount < 0 ? "text-[var(--chart-spend)]" : "text-[var(--chart-income)]"
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
