import type { CampaignInput, ExpenseInput, FraudFlagResult, HistoryExpense } from "@/lib/fraud/types";

const CATEGORY_BENCHMARK: Record<string, number[]> = {
  Food: [2000, 3500, 5000, 8000, 12000, 15000, 20000],
  Medicines: [1500, 4000, 7000, 10000, 15000],
  Clothes: [2000, 4000, 6000, 9500, 12000],
  Logistics: [1000, 2500, 4000, 8000],
  Books: [3000, 5000, 8000, 12000, 18000],
  default: [2000, 5000, 8000, 12000, 20000],
};

export function checkDuplicateBill(
  expense: ExpenseInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const dupHash = history.find((h) => h.billHash && h.billHash === expense.billHash && h.id !== expense.id);
  if (dupHash) {
    return {
      ruleId: "DUPLICATE_BILL",
      severity: "HIGH",
      reason: "This bill file matches another upload already on record.",
    };
  }
  const dupInvoice = history.find(
    (h) =>
      h.vendor.toLowerCase() === expense.vendor.toLowerCase() &&
      h.amountInr === expense.amountInr &&
      expense.invoiceNo &&
      h.invoiceNo === expense.invoiceNo &&
      h.id !== expense.id,
  );
  if (dupInvoice) {
    return {
      ruleId: "DUPLICATE_BILL",
      severity: "HIGH",
      reason: "Same vendor, amount and invoice number appear more than once.",
    };
  }
  return null;
}

export function checkOverBudget(
  expense: ExpenseInput,
  campaign: CampaignInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const item = campaign.budgetItems.find((b) => b.id === expense.budgetItemId);
  if (!item) return null;
  const spent = history
    .filter((h) => h.budgetItemId === expense.budgetItemId && h.id !== expense.id)
    .reduce((sum, h) => sum + h.amountInr, 0);
  if (spent + expense.amountInr > item.amountInr) {
    return {
      ruleId: "OVER_BUDGET",
      severity: "HIGH",
      reason: `This expense would take “${item.category}” past its budget of ₹${item.amountInr.toLocaleString("en-IN")}.`,
    };
  }
  return null;
}

export function checkExceedsRaised(
  expense: ExpenseInput,
  campaign: CampaignInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const spent = history.filter((h) => h.id !== expense.id).reduce((s, h) => s + h.amountInr, 0);
  if (spent + expense.amountInr > campaign.raisedInr) {
    return {
      ruleId: "EXCEEDS_RAISED",
      severity: "HIGH",
      reason: "Spending would exceed the amount raised so far.",
    };
  }
  return null;
}

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function checkUnusualAmount(
  expense: ExpenseInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const same = history
    .filter((h) => h.budgetCategory === expense.budgetCategory && h.id !== expense.id)
    .map((h) => h.amountInr);
  const bench = CATEGORY_BENCHMARK[expense.budgetCategory] ?? CATEGORY_BENCHMARK.default;
  const pool = [...same, ...bench];
  if (pool.length < 4) return null;
  const sorted = [...pool].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = Math.max(q3 - q1, 1);
  const mean = pool.reduce((a, b) => a + b, 0) / pool.length;
  const variance = pool.reduce((a, b) => a + (b - mean) ** 2, 0) / pool.length;
  const sd = Math.sqrt(variance) || 1;
  const z = Math.abs((expense.amountInr - mean) / sd);
  const outlier = expense.amountInr > q3 + 1.5 * iqr || z > 2.5;
  if (outlier) {
    return {
      ruleId: "UNUSUAL_AMOUNT",
      severity: "MEDIUM",
      reason: `This amount is far from the usual range for ${expense.budgetCategory} (typical around ₹${Math.round(median(pool)).toLocaleString("en-IN")}).`,
    };
  }
  return null;
}

export function checkRoundNumberPattern(
  expense: ExpenseInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const recent = [...history.filter((h) => h.id !== expense.id)]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4)
    .map((h) => h.amountInr);
  const series = [expense.amountInr, ...recent];
  const round = (n: number) => n >= 1000 && n % 1000 === 0;
  if (series.length >= 3 && series.every(round)) {
    return {
      ruleId: "ROUND_NUMBER",
      severity: "LOW",
      reason: "Several recent expenses are exact thousands, which is worth a second look.",
    };
  }
  return null;
}

export function checkRapidSequence(
  expense: ExpenseInput,
  history: HistoryExpense[],
): FraudFlagResult | null {
  const windowMs = 48 * 60 * 60 * 1000;
  const now = expense.billDate.getTime();
  const matches = history.filter(
    (h) =>
      h.vendor.toLowerCase() === expense.vendor.toLowerCase() &&
      h.id !== expense.id &&
      Math.abs(h.billDate.getTime() - now) <= windowMs &&
      h.amountInr >= 10000 &&
      expense.amountInr >= 10000,
  );
  if (matches.length >= 1) {
    return {
      ruleId: "RAPID_SEQUENCE",
      severity: "MEDIUM",
      reason: `More than one large payment to ${expense.vendor} within 48 hours.`,
    };
  }
  return null;
}

export function checkDateAnomaly(expense: ExpenseInput, campaign: CampaignInput): FraudFlagResult | null {
  const bill = expense.billDate;
  const start = campaign.startDate;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (bill < start) {
    return {
      ruleId: "DATE_ANOMALY",
      severity: "MEDIUM",
      reason: "The bill date is before this campaign started.",
    };
  }
  if (bill > tomorrow) {
    return {
      ruleId: "DATE_ANOMALY",
      severity: "MEDIUM",
      reason: "The bill date is in the future.",
    };
  }
  return null;
}

export function checkMissingProof(expense: ExpenseInput): FraudFlagResult | null {
  if (!expense.hasBill || !expense.billHash) {
    return {
      ruleId: "MISSING_PROOF",
      severity: "HIGH",
      reason: "No readable bill was attached to this expense.",
    };
  }
  return null;
}

export function checkNewVendorLarge(expense: ExpenseInput, history: HistoryExpense[]): FraudFlagResult | null {
  const prior = history.filter((h) => h.vendor.toLowerCase() === expense.vendor.toLowerCase() && h.id !== expense.id);
  if (prior.length === 0 && expense.amountInr >= 25000) {
    return {
      ruleId: "NEW_VENDOR_LARGE",
      severity: "MEDIUM",
      reason: "First payment to this vendor is large compared with typical first bills.",
    };
  }
  return null;
}

export const ALL_RULES = [
  checkDuplicateBill,
  checkOverBudget,
  checkExceedsRaised,
  checkUnusualAmount,
  checkRoundNumberPattern,
  checkRapidSequence,
  checkDateAnomaly,
  checkMissingProof,
  checkNewVendorLarge,
] as const;
