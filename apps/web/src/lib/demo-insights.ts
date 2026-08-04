/**
 * Pre-generated, grounded insights for the keyless demo path. These are
 * real analysis of the seeded FinPulse data, written once and served
 * verbatim when no ANTHROPIC_API_KEY is configured -- so the deployed demo
 * shows genuine answers instead of a generic mock string, without ever
 * calling a real LLM.
 *
 * Finance-question figures below were computed directly from the seeded DB
 * over the 12 complete months of data (Aug 2025 - Jul 2026); the first
 * month in the dataset (Jul 2025) is a partial ramp-up month and is
 * excluded so monthly averages reflect full months only.
 */
type DemoInsight = {
  /** Every phrasing that should resolve to this insight, normalized-matched. */
  questions: string[];
  insight: string;
};

const DEMO_INSIGHTS: DemoInsight[] = [
  {
    questions: [
      "Which month was my most expensive?",
      "What was my most expensive month?",
      "What's my most expensive month?",
    ],
    insight:
      "Your highest-spending month was April 2026 at $3,516.12 — about 31% above your typical " +
      "month (~$2,688). Almost the entire difference comes down to a single charge: a $650 " +
      "Ticketmaster purchase on April 8th, which was more than 8× any other transaction that " +
      "month. Strip that out and April would've been ~$2,866, right in line with the rest of " +
      "your year. Your spending is otherwise remarkably steady — most months land between " +
      "$2,600 and $3,100, anchored by your fixed $1,850 rent.",
  },
  {
    questions: [
      "How has my dining spending changed?",
      "Has my dining spending changed?",
      "What's the trend in my dining spending?",
      "How is my dining spending trending?",
    ],
    insight:
      "Your dining has drifted up mildly — averaging $323/month in the first half of the year " +
      "and $340/month in the second, about a 5% increase. Nothing dramatic. Your dining runs " +
      "about $331/month on average ($3,976 total across 150 transactions) — lots of small, " +
      "frequent charges rather than big nights out. The busiest months were June 2026 ($383), " +
      "October 2025 ($381), and July 2026 ($379), all clustered close together; March 2026 was " +
      "your lightest at $260. Steady habit, no runaway trend.",
  },
  {
    questions: [
      "What are my biggest spending categories?",
      "What are my top spending categories?",
      "What do I spend the most on?",
      "Biggest spending categories?",
    ],
    insight:
      "Rent dominates at $20,350 — but that's a fixed cost, not a behavior signal. Among your " +
      "variable spending, the two leaders are nearly tied: Groceries at $4,548 and Dining at " +
      "$3,976, together making up about a quarter of your non-rent spending. Transport ($1,750) " +
      "and Utilities ($1,278) follow. So your discretionary money is mostly food — split fairly " +
      "evenly between eating in and eating out.",
  },
  {
    questions: [
      "Were there any unusual transactions?",
      "Any unusual transactions?",
      "Were there any suspicious transactions?",
      "Did you flag any unusual transactions?",
    ],
    insight:
      "Yes — I flagged 5 unusual patterns. A $420 dinner at Nobu that was roughly 10× your " +
      "typical dining charge; a duplicate $31.98 Netflix charge (billed twice); a pair of " +
      "identical $89.99 Amazon charges on the same day (Dec 26) — a classic duplicate-charge " +
      "signature; a $380 Costco run, about 3× a normal grocery trip; and a $650 Ticketmaster " +
      "purchase that single-handedly made April your most expensive month. The duplicates are " +
      "the kind of thing worth disputing; the others look like legitimate one-off large " +
      "purchases.",
  },
  {
    questions: [
      "How much do I spend on subscriptions?",
      "How much do I spend on subscriptions",
      "What do I spend on subscriptions?",
    ],
    insight:
      "You're paying for 2 subscriptions — Netflix ($15.99/mo) and Spotify ($11.99/mo) — " +
      "totaling $351.75 over the past 12 months across 24 charges, about $29.31/month. One " +
      "month had a duplicate Netflix charge ($31.98 instead of $15.99), which is flagged " +
      "separately as an anomaly worth disputing. Subscriptions are a tiny slice of your budget " +
      "— under 1% of your $35,442.07 in total spending over the same period.",
  },
  {
    questions: [
      "What's my average monthly spending?",
      "What is my average monthly spending?",
      "What's my average spending per month?",
      "How much do I spend per month on average?",
    ],
    insight:
      "Over the last 12 full months (Aug 2025–Jul 2026) you've spent $35,442.07 total, " +
      "averaging $2,953.51/month. It's a fairly tight band: your lowest month was March 2026 " +
      "at $2,623.66 and your highest was April 2026 at $3,516.12 (driven by a one-off $650 " +
      "Ticketmaster purchase). Your $1,850 rent is the floor under every month — it alone " +
      "accounts for about 63% of a typical month's spend.",
  },
  {
    questions: [
      "How much do I spend on groceries?",
      "How much do I spend on groceries",
      "What do I spend on groceries?",
    ],
    insight:
      "You've spent $4,548.06 on groceries over the past 12 months across 52 trips — an " +
      "average of $87.46 per trip, or about $379.01/month. Trader Joe's is your top grocery " +
      "merchant at $1,457.90, followed by Costco ($1,210.08), Whole Foods ($1,007.15), and " +
      "Safeway ($872.93). Your single biggest grocery trip was a $380 Costco run on Feb 19, " +
      "2026 — roughly 4× a typical trip, and one of the anomalies flagged elsewhere.",
  },
  {
    questions: [
      "What are my recurring bills?",
      "What recurring bills do I have?",
      "What are my monthly bills?",
    ],
    insight:
      "You have four recurring monthly charges: rent ($1,850, Parkview Apartments), one " +
      "utility bill that rotates between three providers (Metro Water, Comcast, and City " +
      "Power & Light — averaging $106.53/bill), Netflix ($15.99), and Spotify ($11.99). " +
      "Together that's roughly $1,984/month, or $23,830.15 over the past 12 months (rent " +
      "$22,200 + utilities $1,278.40 + subscriptions $351.75). Rent alone makes up 93% of your " +
      "recurring-bill spend.",
  },
  {
    questions: [
      "How much did I spend on dining out?",
      "How much do I spend on dining out?",
      "How much do I spend eating out?",
    ],
    insight:
      "You spent $4,483.89 on dining out over the past 12 months across 153 transactions — " +
      "averaging $29.31 per meal, or about $373.66/month. That's mostly small, frequent " +
      "charges (fast-casual spots like Chipotle and Sweetgreen show up often) rather than big " +
      "nights out. The one outlier was a $420 dinner at Nobu on Aug 1, 2025 — roughly 14× a " +
      "typical meal, flagged separately as an anomaly.",
  },
  {
    questions: [
      "What's my biggest single expense?",
      "What is my biggest single expense?",
      "What's my biggest expense?",
      "What was my largest purchase?",
    ],
    insight:
      "Your single biggest one-off expense was a $650 Ticketmaster purchase on April 8, 2026 " +
      "— it's what pushed April to be your most expensive month. Setting aside recurring costs " +
      "like rent, the next largest were a $420 dinner at Nobu (Aug 1, 2025) and a $380 Costco " +
      "grocery run (Feb 19, 2026). If you count recurring bills, your $1,850/month rent " +
      "(Parkview Apartments) is technically bigger, but it's a fixed cost rather than a one-off " +
      "purchase.",
  },
  {
    questions: ["hi", "hello", "hey", "hi there", "hello there", "hey there", "yo", "howdy"],
    insight:
      "Hey! I'm FinPulse's insights assistant — ask me anything about your spending and I'll " +
      'dig into the real numbers behind it. A couple of things to try: "What are my biggest ' +
      'spending categories?" or "How much do I spend on groceries?"',
  },
  {
    questions: [
      "what can you do",
      "what can you do?",
      "help",
      "what can i ask",
      "what can i ask you",
      "what can i ask you?",
      "what questions can i ask",
    ],
    insight:
      "I can analyze your transaction history and answer questions about your spending — " +
      "categories, trends, unusual charges, subscriptions, and more. A few things to try: " +
      '"What are my biggest spending categories?", "Which month was my most expensive?", ' +
      '"Were there any unusual transactions?", or "How much do I spend on subscriptions?"',
  },
  {
    questions: ["thanks", "thank you", "thanks!", "thank you!", "ty", "appreciate it"],
    insight:
      "You're welcome! Let me know if you want to dig into anything else about your spending.",
  },
];

export const DEMO_FALLBACK_MESSAGE =
  "This is a live demo running on pre-generated insights. Try one of the suggested questions " +
  "above — or run the project with an ANTHROPIC_API_KEY to ask anything and get live " +
  "AI-generated answers.";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * Looks up a pre-generated insight for a demo question, tolerant of case,
 * punctuation, and surrounding whitespace. Returns null if the question
 * doesn't match one of the suggested demo questions or their aliases.
 */
export function findDemoInsight(question: string): string | null {
  const normalized = normalize(question);
  const match = DEMO_INSIGHTS.find((entry) =>
    entry.questions.some((alias) => normalize(alias) === normalized),
  );
  return match ? match.insight : null;
}
