import { Category } from "@prisma/client";
import { prisma } from "./prisma";

export type RecentTransaction = {
  id: string;
  date: Date;
  merchant: string;
  amount: number;
  category: Category;
  accountName: string;
};

export type CategorySpend = {
  category: Category;
  total: number;
};

export type MonthlySpend = {
  month: string;
  spend: number;
  income: number;
};

export type SummaryStats = {
  totalSpend: number;
  totalIncome: number;
  net: number;
  transactionCount: number;
};

export function twelveMonthsAgo(now: Date = new Date()): Date {
  const date = new Date(now);
  date.setMonth(date.getMonth() - 12);
  return date;
}

export function aggregateSpendByCategory(
  transactions: { category: Category; amount: number }[],
): CategorySpend[] {
  const totals = new Map<Category, number>();
  for (const tx of transactions) {
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + Math.abs(tx.amount));
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function aggregateMonthlySpend(
  transactions: { date: Date; amount: number }[],
): MonthlySpend[] {
  const buckets = new Map<string, { spend: number; income: number }>();
  for (const tx of transactions) {
    const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(month) ?? { spend: 0, income: 0 };
    if (tx.amount < 0) {
      bucket.spend += Math.abs(tx.amount);
    } else {
      bucket.income += tx.amount;
    }
    buckets.set(month, bucket);
  }
  return Array.from(buckets.entries())
    .map(([month, totals]) => ({ month, ...totals }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function aggregateSummaryStats(transactions: { amount: number }[]): SummaryStats {
  let totalSpend = 0;
  let totalIncome = 0;
  for (const tx of transactions) {
    if (tx.amount < 0) {
      totalSpend += Math.abs(tx.amount);
    } else {
      totalIncome += tx.amount;
    }
  }
  return {
    totalSpend,
    totalIncome,
    net: totalIncome - totalSpend,
    transactionCount: transactions.length,
  };
}

export async function getRecentTransactions(limit: number): Promise<RecentTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { account: { select: { name: true } } },
  });
  return transactions.map((tx) => ({
    id: tx.id,
    date: tx.date,
    merchant: tx.merchant,
    amount: tx.amount.toNumber(),
    category: tx.category,
    accountName: tx.account.name,
  }));
}

export async function getSpendByCategory(): Promise<CategorySpend[]> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: twelveMonthsAgo() }, category: { not: Category.INCOME } },
    select: { category: true, amount: true },
  });
  return aggregateSpendByCategory(
    transactions.map((tx) => ({ category: tx.category, amount: tx.amount.toNumber() })),
  );
}

export async function getMonthlySpend(): Promise<MonthlySpend[]> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: twelveMonthsAgo() } },
    select: { date: true, amount: true },
  });
  return aggregateMonthlySpend(
    transactions.map((tx) => ({ date: tx.date, amount: tx.amount.toNumber() })),
  );
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: twelveMonthsAgo() } },
    select: { amount: true },
  });
  return aggregateSummaryStats(transactions.map((tx) => ({ amount: tx.amount.toNumber() })));
}
