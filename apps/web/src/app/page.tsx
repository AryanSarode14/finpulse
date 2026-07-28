import { MonthlySpendChart } from "@/components/MonthlySpendChart";
import { RecentTransactionsTable } from "@/components/RecentTransactionsTable";
import { SpendByCategoryChart } from "@/components/SpendByCategoryChart";
import { SummaryCards } from "@/components/SummaryCards";
import {
  getMonthlySpend,
  getRecentTransactions,
  getSpendByCategory,
  getSummaryStats,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, spendByCategory, monthlySpend, recentTransactions] = await Promise.all([
    getSummaryStats(),
    getSpendByCategory(),
    getMonthlySpend(),
    getRecentTransactions(25),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            FinPulse
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Spending insights, at a glance.</p>
        </div>
      </header>

      <SummaryCards stats={stats} />

      <div className="grid gap-5 lg:grid-cols-2">
        <SpendByCategoryChart data={spendByCategory} />
        <MonthlySpendChart data={monthlySpend} />
      </div>

      <RecentTransactionsTable transactions={recentTransactions} />
    </main>
  );
}
