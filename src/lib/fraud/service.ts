import {
  checkDateAnomaly,
  checkDuplicateBill,
  checkExceedsRaised,
  checkMissingProof,
  checkNewVendorLarge,
  checkOverBudget,
  checkRapidSequence,
  checkRoundNumberPattern,
  checkUnusualAmount,
} from "@/lib/fraud/rules";
import type { CampaignInput, ExpenseInput, FraudAnalysis, HistoryExpense } from "@/lib/fraud/types";

function scoreFromFlags(flags: FraudAnalysis["flags"]) {
  const weights = { LOW: 12, MEDIUM: 28, HIGH: 45 };
  const raw = flags.reduce((s, f) => s + weights[f.severity], 0);
  return Math.min(100, raw);
}

function levelFromScore(score: number): FraudAnalysis["level"] {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function templateExplanation(analysis: Omit<FraudAnalysis, "explanation">) {
  if (analysis.flags.length === 0) {
    return "No automated checks were triggered. A person can still review the bill.";
  }
  return analysis.flags.map((f) => f.reason).join(" ");
}

export class FraudDetectionService {
  analyzeExpense(expense: ExpenseInput, campaign: CampaignInput, history: HistoryExpense[]): FraudAnalysis {
    const flags = [
      checkDuplicateBill(expense, history),
      checkOverBudget(expense, campaign, history),
      checkExceedsRaised(expense, campaign, history),
      checkUnusualAmount(expense, history),
      checkRoundNumberPattern(expense, history),
      checkRapidSequence(expense, history),
      checkDateAnomaly(expense, campaign),
      checkMissingProof(expense),
      checkNewVendorLarge(expense, history),
    ].filter((f): f is NonNullable<typeof f> => Boolean(f));

    const riskScore = scoreFromFlags(flags);
    const level = levelFromScore(riskScore);
    const base = { riskScore, level, flags };
    return { ...base, explanation: templateExplanation(base) };
  }
}

export const fraudDetection = new FraudDetectionService();
