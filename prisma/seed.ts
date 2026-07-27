import { faker } from "@faker-js/faker";
import { AccountType, Category, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

faker.seed(1337);

function money(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

const DINING_MERCHANTS = [
  "Chipotle",
  "Sweetgreen",
  "Thai Palace",
  "Pizzeria Roma",
  "Local Bistro",
  "Ramen House",
  "Corner Deli",
];
const TRANSPORT_MERCHANTS = ["Uber", "Lyft", "Shell Gas", "Metro Transit", "City Parking"];
const UTILITY_MERCHANTS = ["City Power & Light", "Metro Water Utility", "Comcast Internet"];
const GROCERY_MERCHANTS = ["Whole Foods", "Trader Joe's", "Safeway", "Costco"];

type TxInput = {
  accountId: string;
  date: Date;
  amount: Prisma.Decimal;
  merchant: string;
  description: string;
  category: Category;
  isAnomaly?: boolean;
};

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();

  const checking = await prisma.account.create({
    data: { name: "Everyday Checking", type: AccountType.CHECKING },
  });
  const card = await prisma.account.create({
    data: { name: "Rewards Card", type: AccountType.CREDIT },
  });
  await prisma.account.create({
    data: { name: "Savings", type: AccountType.SAVINGS },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - 12);

  // Spread the 5 planted anomalies across distinct months (offsets from `start`).
  const anomalyMonths = { dining: 1, netflix: 3, duplicate: 5, groceries: 7, entertainment: 9 };

  const txs: TxInput[] = [];

  // Biweekly salary, checking, income.
  for (let d = new Date(start); d <= today; d = addDays(d, 14)) {
    txs.push({
      accountId: checking.id,
      date: new Date(d),
      amount: money(2800),
      merchant: "Employer Payroll",
      description: "Direct deposit - salary",
      category: Category.INCOME,
    });
  }

  // Monthly recurring: rent, Netflix, Spotify, utilities.
  for (let m = 0; ; m++) {
    const year = start.getFullYear();
    const month = start.getMonth() + m;

    const rentDate = monthDate(year, month, 1);
    if (rentDate > today) break;
    txs.push({
      accountId: checking.id,
      date: rentDate,
      amount: money(-1850),
      merchant: "Parkview Apartments",
      description: "Monthly rent",
      category: Category.RENT,
    });

    const netflixDate = monthDate(year, month, 5);
    const isDoubledNetflix = m === anomalyMonths.netflix;
    txs.push({
      accountId: card.id,
      date: netflixDate,
      amount: money(isDoubledNetflix ? -31.98 : -15.99),
      merchant: "Netflix",
      description: isDoubledNetflix
        ? "Netflix subscription (duplicate charge)"
        : "Netflix subscription",
      category: Category.SUBSCRIPTIONS,
      isAnomaly: isDoubledNetflix,
    });

    const spotifyDate = monthDate(year, month, 8);
    txs.push({
      accountId: card.id,
      date: spotifyDate,
      amount: money(-11.99),
      merchant: "Spotify",
      description: "Spotify subscription",
      category: Category.SUBSCRIPTIONS,
    });

    const utilitiesDate = monthDate(year, month, 15);
    txs.push({
      accountId: checking.id,
      date: utilitiesDate,
      amount: money(-faker.number.float({ min: 80, max: 140, fractionDigits: 2 })),
      merchant: faker.helpers.arrayElement(UTILITY_MERCHANTS),
      description: "Utility bill",
      category: Category.UTILITIES,
    });
  }

  // Weekly: groceries, dining, transport.
  for (let w = 0; ; w++) {
    const weekStart = addDays(start, w * 7);
    if (weekStart > today) break;

    const groceryDay = addDays(weekStart, faker.number.int({ min: 0, max: 6 }));
    if (groceryDay <= today) {
      txs.push({
        accountId: checking.id,
        date: groceryDay,
        amount: money(-faker.number.float({ min: 40, max: 120, fractionDigits: 2 })),
        merchant: faker.helpers.arrayElement(GROCERY_MERCHANTS),
        description: "Grocery run",
        category: Category.GROCERIES,
      });
    }

    const diningCount = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < diningCount; i++) {
      const diningDay = addDays(weekStart, faker.number.int({ min: 0, max: 6 }));
      if (diningDay > today) continue;
      txs.push({
        accountId: card.id,
        date: diningDay,
        amount: money(-faker.number.float({ min: 8, max: 45, fractionDigits: 2 })),
        merchant: faker.helpers.arrayElement(DINING_MERCHANTS),
        description: "Restaurant",
        category: Category.DINING,
      });
    }

    const transportCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < transportCount; i++) {
      const transportDay = addDays(weekStart, faker.number.int({ min: 0, max: 6 }));
      if (transportDay > today) continue;
      txs.push({
        accountId: card.id,
        date: transportDay,
        amount: money(-faker.number.float({ min: 3, max: 30, fractionDigits: 2 })),
        merchant: faker.helpers.arrayElement(TRANSPORT_MERCHANTS),
        description: "Transport",
        category: Category.TRANSPORT,
      });
    }
  }

  // Remaining planted anomalies: one-off dining spike, duplicate charge pair,
  // oversized grocery run, one-off entertainment splurge.
  const diningAnomalyDate = monthDate(
    start.getFullYear(),
    start.getMonth() + anomalyMonths.dining,
    faker.number.int({ min: 1, max: 27 }),
  );
  txs.push({
    accountId: card.id,
    date: diningAnomalyDate,
    amount: money(-420),
    merchant: "Nobu",
    description: "Anniversary dinner",
    category: Category.DINING,
    isAnomaly: true,
  });

  const duplicateDate = monthDate(
    start.getFullYear(),
    start.getMonth() + anomalyMonths.duplicate,
    faker.number.int({ min: 1, max: 27 }),
  );
  for (let i = 0; i < 2; i++) {
    txs.push({
      accountId: card.id,
      date: duplicateDate,
      amount: money(-89.99),
      merchant: "Amazon",
      description: "Amazon order (duplicate charge)",
      category: Category.OTHER,
      isAnomaly: true,
    });
  }

  const groceryAnomalyDate = monthDate(
    start.getFullYear(),
    start.getMonth() + anomalyMonths.groceries,
    faker.number.int({ min: 1, max: 27 }),
  );
  txs.push({
    accountId: checking.id,
    date: groceryAnomalyDate,
    amount: money(-380),
    merchant: "Costco",
    description: "Bulk stock-up run",
    category: Category.GROCERIES,
    isAnomaly: true,
  });

  const entertainmentAnomalyDate = monthDate(
    start.getFullYear(),
    start.getMonth() + anomalyMonths.entertainment,
    faker.number.int({ min: 1, max: 27 }),
  );
  txs.push({
    accountId: card.id,
    date: entertainmentAnomalyDate,
    amount: money(-650),
    merchant: "Ticketmaster",
    description: "Concert tickets",
    category: Category.ENTERTAINMENT,
    isAnomaly: true,
  });

  await prisma.transaction.createMany({ data: txs });

  const total = await prisma.transaction.count();
  const byCategory = await prisma.transaction.groupBy({
    by: ["category"],
    _count: { _all: true },
    orderBy: { category: "asc" },
  });
  const anomalies = await prisma.transaction.findMany({
    where: { isAnomaly: true },
    orderBy: { date: "asc" },
  });

  console.log(`\nSeeded ${total} transactions.\n`);
  console.log("By category:");
  for (const row of byCategory) {
    console.log(`  ${row.category}: ${row._count._all}`);
  }
  console.log("\nPlanted anomalies:");
  for (const a of anomalies) {
    console.log(
      `  ${a.date.toISOString().slice(0, 10)}  ${a.merchant.padEnd(15)}  ${a.amount.toString()}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
