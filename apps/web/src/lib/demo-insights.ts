/**
 * Pre-generated, grounded insights for the keyless demo path. These are
 * real analysis of the seeded FinPulse data, written once and served
 * verbatim when no ANTHROPIC_API_KEY is configured -- so the deployed demo
 * shows genuine answers instead of a generic mock string, without ever
 * calling a real LLM.
 *
 * Finance-question figures below were computed directly from the seeded DB
 * using the exact same trailing-12-months window as the app's query layer
 * (`twelveMonthsAgo` / `getSpendByCategory` / `getSummaryStats` in
 * @finpulse/core, i.e. every transaction with `date >= now - 12 months`),
 * so the numbers here agree with both the live dashboard and the other
 * pre-generated insights above.
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
      "totaling $351.75 over the trailing 12 months across 24 charges, about $29.31/month. One " +
      "Netflix charge was billed twice ($31.98 instead of $15.99, on Oct 5, 2025), which is " +
      "flagged separately as a duplicate-charge anomaly. Subscriptions are a tiny slice of your " +
      "budget — about 1% of your $33,084.56 in total spending over the same period.",
  },
  {
    questions: [
      "What's my average monthly spending?",
      "What is my average monthly spending?",
      "What's my average spending per month?",
      "How much do I spend per month on average?",
    ],
    insight:
      "Over the trailing 12 months you've spent $33,084.56 total across 357 transactions, " +
      "averaging $2,757.05/month. Full months range from a light $2,623.66 in March 2026 up to " +
      "$3,516.12 in April 2026 (driven by a one-off $650 Ticketmaster purchase) — most months " +
      "land in the high-$2,600s to low-$3,100s. Your $1,850 rent is the floor under every month " +
      "— about 67% of a typical month's spend.",
  },
  {
    questions: [
      "How much do I spend on groceries?",
      "How much do I spend on groceries",
      "What do I spend on groceries?",
    ],
    insight:
      "You've spent $4,548.06 on groceries over the trailing 12 months across 52 trips — an " +
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
      "Together that's roughly $1,985/month, or $21,980.15 over the trailing 12 months (rent " +
      "$20,350 + utilities $1,278.40 + subscriptions $351.75). Rent alone makes up 93% of your " +
      "recurring-bill spend.",
  },
  {
    questions: [
      "How much did I spend on dining out?",
      "How much do I spend on dining out?",
      "How much do I spend eating out?",
    ],
    insight:
      "You spent $3,976.38 on dining out over the trailing 12 months across 150 transactions " +
      "— averaging $26.51 per meal, or about $331.37/month. It's mostly small, frequent " +
      "charges: Sweetgreen ($888.09 across 30 visits) and Ramen House ($805.43 across 32 " +
      "visits) are your top spots, followed by Pizzeria Roma, Corner Deli, and Local Bistro. " +
      "No single blowout meal here — your largest dining charge was a modest $44.89 at Ramen " +
      "House on Jan 2, 2026.",
  },
  {
    questions: [
      "What's my biggest single expense?",
      "What is my biggest single expense?",
      "What's my biggest expense?",
      "What was my largest purchase?",
    ],
    insight:
      "Your single biggest one-off expense over the trailing 12 months was a $650 Ticketmaster " +
      "purchase on April 8, 2026 — it's what pushed April to be your most expensive month. " +
      "Next largest was a $380 Costco grocery run (Feb 19, 2026), then a $127.65 water utility " +
      "bill (Mar 15, 2026) — a steep drop-off after the top two. If you count recurring bills, " +
      "your $1,850/month rent (Parkview Apartments) is technically bigger, but it's a fixed " +
      "cost rather than a one-off purchase.",
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
