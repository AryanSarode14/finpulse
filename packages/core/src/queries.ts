import { Category, type PrismaClient } from "@prisma/client";

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

export type TransactionFilters = {
  category?: Category | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  limit?: number | undefined;
};

const DEFAULT_MONTHS = 12;
const DEFAULT_LIST_LIMIT = 25;

export function monthsAgo(months: number, now: Date = new Date()): Date {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date;
}

export function twelveMonthsAgo(now: Date = new Date()): Date {
  return monthsAgo(DEFAULT_MONTHS, now);
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

function mapTransaction(tx: {
  id: string;
  date: Date;
  merchant: string;
  amount: { toNumber(): number };
  category: Category;
  account: { name: string };
}): RecentTransaction {
  return {
    id: tx.id,
    date: tx.date,
    merchant: tx.merchant,
    amount: tx.amount.toNumber(),
    category: tx.category,
    accountName: tx.account.name,
  };
}

export async function getRecentTransactions(
  prisma: PrismaClient,
  limit: number,
): Promise<RecentTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { account: { select: { name: true } } },
  });
  return transactions.map(mapTransaction);
}

export async function listTransactions(
  prisma: PrismaClient,
  filters: TransactionFilters = {},
): Promise<RecentTransaction[]> {
  const {
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    limit = DEFAULT_LIST_LIMIT,
  } = filters;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            amount: {
              ...(minAmount !== undefined ? { gte: minAmount } : {}),
              ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: limit,
    include: { account: { select: { name: true } } },
  });
  return transactions.map(mapTransaction);
}

export async function getSpendByCategory(
  prisma: PrismaClient,
  months: number = DEFAULT_MONTHS,
): Promise<CategorySpend[]> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: monthsAgo(months) }, category: { not: Category.INCOME } },
    select: { category: true, amount: true },
  });
  return aggregateSpendByCategory(
    transactions.map((tx) => ({ category: tx.category, amount: tx.amount.toNumber() })),
  );
}

export async function getMonthlySpend(
  prisma: PrismaClient,
  months: number = DEFAULT_MONTHS,
): Promise<MonthlySpend[]> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: monthsAgo(months) } },
    select: { date: true, amount: true },
  });
  return aggregateMonthlySpend(
    transactions.map((tx) => ({ date: tx.date, amount: tx.amount.toNumber() })),
  );
}

export async function getSummaryStats(
  prisma: PrismaClient,
  months: number = DEFAULT_MONTHS,
): Promise<SummaryStats> {
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: monthsAgo(months) } },
    select: { amount: true },
  });
  return aggregateSummaryStats(transactions.map((tx) => ({ amount: tx.amount.toNumber() })));
}
