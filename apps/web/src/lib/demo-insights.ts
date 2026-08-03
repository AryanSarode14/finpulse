/**
 * Pre-generated, grounded insights for the keyless demo path. These are
 * real analysis of the seeded FinPulse data, written once and served
 * verbatim when no ANTHROPIC_API_KEY is configured -- so the deployed demo
 * shows genuine answers instead of a generic mock string, without ever
 * calling a real LLM.
 */
type DemoInsight = {
  question: string;
  insight: string;
};

const DEMO_INSIGHTS: DemoInsight[] = [
  {
    question: "Which month was my most expensive?",
    insight:
      "Your highest-spending month was April 2026 at $3,516.12 — about 31% above your typical " +
      "month (~$2,688). Almost the entire difference comes down to a single charge: a $650 " +
      "Ticketmaster purchase on April 8th, which was more than 8× any other transaction that " +
      "month. Strip that out and April would've been ~$2,866, right in line with the rest of " +
      "your year. Your spending is otherwise remarkably steady — most months land between " +
      "$2,600 and $3,100, anchored by your fixed $1,850 rent.",
  },
  {
    question: "How has my dining spending changed?",
    insight:
      "Your dining has drifted up mildly — averaging $323/month in the first half of the year " +
      "and $340/month in the second, about a 5% increase. Nothing dramatic. Your dining runs " +
      "about $331/month on average ($3,976 total across 150 transactions) — lots of small, " +
      "frequent charges rather than big nights out. The busiest months were June 2026 ($383), " +
      "October 2025 ($381), and July 2026 ($379), all clustered close together; March 2026 was " +
      "your lightest at $260. Steady habit, no runaway trend.",
  },
  {
    question: "What are my biggest spending categories?",
    insight:
      "Rent dominates at $20,350 — but that's a fixed cost, not a behavior signal. Among your " +
      "variable spending, the two leaders are nearly tied: Groceries at $4,548 and Dining at " +
      "$3,976, together making up about a quarter of your non-rent spending. Transport ($1,750) " +
      "and Utilities ($1,278) follow. So your discretionary money is mostly food — split fairly " +
      "evenly between eating in and eating out.",
  },
  {
    question: "Were there any unusual transactions?",
    insight:
      "Yes — I flagged 5 unusual patterns. A $420 dinner at Nobu that was roughly 10× your " +
      "typical dining charge; a duplicate $31.98 Netflix charge (billed twice); a pair of " +
      "identical $89.99 Amazon charges on the same day (Dec 26) — a classic duplicate-charge " +
      "signature; a $380 Costco run, about 3× a normal grocery trip; and a $650 Ticketmaster " +
      "purchase that single-handedly made April your most expensive month. The duplicates are " +
      "the kind of thing worth disputing; the others look like legitimate one-off large " +
      "purchases.",
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
 * doesn't match one of the suggested demo questions.
 */
export function findDemoInsight(question: string): string | null {
  const normalized = normalize(question);
  const match = DEMO_INSIGHTS.find((entry) => normalize(entry.question) === normalized);
  return match ? match.insight : null;
}
